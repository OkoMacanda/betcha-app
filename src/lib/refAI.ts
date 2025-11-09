import { supabase } from '@/integrations/supabase/client';

export interface Evidence {
  id: string;
  type: 'photo' | 'video' | 'score_sheet' | 'text' | 'number';
  file_url?: string;
  metadata: Record<string, any>;
  verified: boolean;
}

export interface RefDecision {
  decision_type: 'auto_resolve' | 'needs_evidence' | 'dispute_required' | 'manual_review';
  confidence_score: number; // 0-100
  winner_id?: string;
  reasoning: string;
  evidence_quality: 'high' | 'medium' | 'low';
}

export interface GameRule {
  id: string;
  win_condition: {
    type: string;
    params: Record<string, any>;
  };
  evidence_required: string[];
  auto_verifiable: boolean;
}

/**
 * REF AI v1 - Basic Rule Engine
 * Evaluates evidence and determines bet outcome
 */
export class RefAI {
  /**
   * Evaluate evidence and make decision
   */
  async evaluateBet(
    betId: string,
    gameRule: GameRule,
    submittedEvidence: Evidence[]
  ): Promise<RefDecision> {
    // 1. Check evidence completeness
    const evidenceCheck = this.checkEvidenceCompleteness(
      gameRule.evidence_required,
      submittedEvidence
    );

    if (!evidenceCheck.complete) {
      return {
        decision_type: 'needs_evidence',
        confidence_score: 0,
        reasoning: `Missing required evidence: ${evidenceCheck.missing.join(', ')}`,
        evidence_quality: 'low',
      };
    }

    // 2. Validate evidence quality
    const qualityScore = this.assessEvidenceQuality(submittedEvidence);

    // 3. Apply win condition logic
    const outcome = await this.applyWinCondition(
      gameRule.win_condition,
      submittedEvidence
    );

    // 4. Calculate confidence score
    const confidenceScore = this.calculateConfidence(
      qualityScore,
      outcome,
      gameRule.auto_verifiable
    );

    // 5. Make decision based on confidence
    if (confidenceScore >= 95) {
      return {
        decision_type: 'auto_resolve',
        confidence_score: confidenceScore,
        winner_id: outcome.winner_id,
        reasoning: outcome.reasoning,
        evidence_quality: qualityScore >= 80 ? 'high' : 'medium',
      };
    } else if (confidenceScore >= 70) {
      return {
        decision_type: 'needs_evidence',
        confidence_score: confidenceScore,
        reasoning: 'Additional evidence required for conclusive decision',
        evidence_quality: qualityScore >= 60 ? 'medium' : 'low',
      };
    } else {
      return {
        decision_type: 'manual_review',
        confidence_score: confidenceScore,
        reasoning: 'Insufficient confidence for automated decision. Escalating to admin review.',
        evidence_quality: 'low',
      };
    }
  }

  /**
   * Check if all required evidence types are submitted
   */
  private checkEvidenceCompleteness(
    required: string[],
    submitted: Evidence[]
  ): { complete: boolean; missing: string[] } {
    const submittedTypes = submitted.map((e) => e.type);
    const missing = required.filter((req) => !submittedTypes.includes(req as any));

    return {
      complete: missing.length === 0,
      missing,
    };
  }

  /**
   * Assess quality of submitted evidence (0-100 score)
   */
  private assessEvidenceQuality(evidence: Evidence[]): number {
    let totalScore = 0;
    let maxScore = evidence.length * 100;

    evidence.forEach((item) => {
      let itemScore = 0;

      // Verified evidence gets full points
      if (item.verified) {
        itemScore += 60;
      }

      // Check metadata completeness
      if (item.metadata.timestamp) itemScore += 15;
      if (item.metadata.gps_location) itemScore += 10;
      if (item.metadata.file_hash) itemScore += 15;

      totalScore += itemScore;
    });

    return Math.round((totalScore / maxScore) * 100);
  }

  /**
   * Apply win condition logic to determine winner
   */
  private async applyWinCondition(
    winCondition: { type: string; params: any },
    evidence: Evidence[]
  ): Promise<{ winner_id?: string; reasoning: string }> {
    switch (winCondition.type) {
      case 'first_to_score':
        return this.evaluateFirstToScore(evidence, winCondition.params);

      case 'most_correct':
        return this.evaluateMostCorrect(evidence, winCondition.params);

      case 'fastest_time':
        return this.evaluateFastestTime(evidence, winCondition.params);

      case 'yes_no':
        return this.evaluateYesNo(evidence, winCondition.params);

      case 'checkmate_or_resign':
        return this.evaluateCheckmate(evidence);

      case 'most_goals':
        return this.evaluateMostGoals(evidence);

      case 'highest_score':
        return this.evaluateHighestScore(evidence);

      case 'most_reps':
        return this.evaluateMostReps(evidence);

      case 'longest_time':
        return this.evaluateLongestTime(evidence);

      default:
        return {
          reasoning: `Unknown win condition type: ${winCondition.type}`,
        };
    }
  }

  /**
   * Evaluate "first to score X points" win condition
   */
  private evaluateFirstToScore(
    evidence: Evidence[],
    params: { target: number; margin?: number }
  ): { winner_id?: string; reasoning: string } {
    const scoreEvidence = evidence.find((e) =>
      e.type === 'score_sheet' || e.type === 'number'
    );

    if (!scoreEvidence?.metadata?.scores) {
      return { reasoning: 'No valid score data found in evidence' };
    }

    const scores = scoreEvidence.metadata.scores;
    const [player1Score, player2Score] = scores;

    if (player1Score >= params.target && player1Score > player2Score) {
      const margin = player1Score - player2Score;
      const requiredMargin = params.margin || 0;

      if (margin >= requiredMargin) {
        return {
          winner_id: scoreEvidence.metadata.player1_id,
          reasoning: `Player 1 reached ${params.target} points first with score ${player1Score}-${player2Score}`,
        };
      }
    }

    if (player2Score >= params.target && player2Score > player1Score) {
      const margin = player2Score - player1Score;
      const requiredMargin = params.margin || 0;

      if (margin >= requiredMargin) {
        return {
          winner_id: scoreEvidence.metadata.player2_id,
          reasoning: `Player 2 reached ${params.target} points first with score ${player2Score}-${player1Score}`,
        };
      }
    }

    return { reasoning: 'No clear winner based on score data' };
  }

  /**
   * Evaluate "most correct answers" win condition
   */
  private evaluateMostCorrect(
    evidence: Evidence[],
    params: { rounds: number }
  ): { winner_id?: string; reasoning: string } {
    const scoreEvidence = evidence.find((e) => e.type === 'score_sheet');

    if (!scoreEvidence?.metadata?.correct_counts) {
      return { reasoning: 'No valid score sheet found' };
    }

    const { player1_correct, player2_correct, player1_id, player2_id } =
      scoreEvidence.metadata;

    if (player1_correct > player2_correct) {
      return {
        winner_id: player1_id,
        reasoning: `Player 1 scored ${player1_correct} correct out of ${params.rounds}, beating Player 2's ${player2_correct}`,
      };
    } else if (player2_correct > player1_correct) {
      return {
        winner_id: player2_id,
        reasoning: `Player 2 scored ${player2_correct} correct out of ${params.rounds}, beating Player 1's ${player1_correct}`,
      };
    }

    return { reasoning: 'Tie - both players scored equally' };
  }

  /**
   * Evaluate "fastest time" win condition
   */
  private evaluateFastestTime(
    evidence: Evidence[],
    params: { distance?: number }
  ): { winner_id?: string; reasoning: string } {
    const timeEvidence = evidence.filter((e) =>
      e.metadata.completion_time && (!params.distance || e.metadata.distance === params.distance)
    );

    if (timeEvidence.length < 2) {
      return { reasoning: 'Incomplete time data for both participants' };
    }

    const times = timeEvidence.map((e) => ({
      user_id: e.metadata.user_id,
      time: e.metadata.completion_time,
    }));

    times.sort((a, b) => a.time - b.time);

    const distanceStr = params.distance ? ` for ${params.distance}km` : '';
    return {
      winner_id: times[0].user_id,
      reasoning: `Fastest time: ${times[0].time} seconds${distanceStr}`,
    };
  }

  /**
   * Evaluate yes/no outcome
   */
  private evaluateYesNo(
    evidence: Evidence[],
    params: any
  ): { winner_id?: string; reasoning: string } {
    const outcomeEvidence = evidence.find((e) => e.metadata.outcome);

    if (!outcomeEvidence) {
      return { reasoning: 'No outcome evidence provided' };
    }

    const outcome = outcomeEvidence.metadata.outcome;
    const predictorId = outcomeEvidence.metadata.predictor_id;

    return {
      winner_id: predictorId,
      reasoning: `Outcome: ${outcome}. Predictor was correct.`,
    };
  }

  /**
   * Evaluate chess game outcome
   */
  private evaluateCheckmate(
    evidence: Evidence[]
  ): { winner_id?: string; reasoning: string } {
    const gameEvidence = evidence.find((e) =>
      e.metadata.game_link || e.metadata.pgn
    );

    if (!gameEvidence) {
      return { reasoning: 'No game link or PGN provided' };
    }

    const winner = gameEvidence.metadata.winner;
    const result = gameEvidence.metadata.result;

    if (!winner) {
      return { reasoning: 'Game result unclear or drawn' };
    }

    return {
      winner_id: winner,
      reasoning: `Game ended with result: ${result}`,
    };
  }

  /**
   * Evaluate most goals/points
   */
  private evaluateMostGoals(
    evidence: Evidence[]
  ): { winner_id?: string; reasoning: string } {
    const scoreEvidence = evidence.find((e) => e.type === 'score_sheet');

    if (!scoreEvidence?.metadata?.scores) {
      return { reasoning: 'No score data found' };
    }

    const { player1_goals, player2_goals, player1_id, player2_id } =
      scoreEvidence.metadata;

    if (player1_goals > player2_goals) {
      return {
        winner_id: player1_id,
        reasoning: `Player 1 scored ${player1_goals} goals vs ${player2_goals}`,
      };
    } else if (player2_goals > player1_goals) {
      return {
        winner_id: player2_id,
        reasoning: `Player 2 scored ${player2_goals} goals vs ${player1_goals}`,
      };
    }

    return { reasoning: 'Game ended in a tie' };
  }

  /**
   * Evaluate highest score
   */
  private evaluateHighestScore(
    evidence: Evidence[]
  ): { winner_id?: string; reasoning: string } {
    const scoreEvidence = evidence.find((e) => e.type === 'score_sheet');

    if (!scoreEvidence?.metadata?.final_scores) {
      return { reasoning: 'No final score data found' };
    }

    const { player1_score, player2_score, player1_id, player2_id } =
      scoreEvidence.metadata.final_scores;

    if (player1_score > player2_score) {
      return {
        winner_id: player1_id,
        reasoning: `Player 1 scored ${player1_score} vs ${player2_score}`,
      };
    } else if (player2_score > player1_score) {
      return {
        winner_id: player2_id,
        reasoning: `Player 2 scored ${player2_score} vs ${player1_score}`,
      };
    }

    return { reasoning: 'Scores are tied' };
  }

  /**
   * Evaluate most reps (physical challenges)
   */
  private evaluateMostReps(
    evidence: Evidence[]
  ): { winner_id?: string; reasoning: string } {
    const repEvidence = evidence.filter((e) => e.metadata.rep_count);

    if (repEvidence.length < 2) {
      return { reasoning: 'Incomplete rep count data' };
    }

    const reps = repEvidence.map((e) => ({
      user_id: e.metadata.user_id,
      count: e.metadata.rep_count,
    }));

    reps.sort((a, b) => b.count - a.count);

    return {
      winner_id: reps[0].user_id,
      reasoning: `${reps[0].count} reps vs ${reps[1].count} reps`,
    };
  }

  /**
   * Evaluate longest time held (plank, handstand, etc.)
   */
  private evaluateLongestTime(
    evidence: Evidence[]
  ): { winner_id?: string; reasoning: string } {
    const timeEvidence = evidence.filter((e) => e.metadata.hold_duration);

    if (timeEvidence.length < 2) {
      return { reasoning: 'Incomplete time data' };
    }

    const times = timeEvidence.map((e) => ({
      user_id: e.metadata.user_id,
      duration: e.metadata.hold_duration,
    }));

    times.sort((a, b) => b.duration - a.duration);

    return {
      winner_id: times[0].user_id,
      reasoning: `Held for ${times[0].duration} seconds vs ${times[1].duration} seconds`,
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    evidenceQuality: number,
    outcome: { winner_id?: string; reasoning: string },
    autoVerifiable: boolean
  ): number {
    let confidence = 0;

    // Base confidence from evidence quality (0-60 points)
    confidence += evidenceQuality * 0.6;

    // Clear winner determination (+30 points)
    if (outcome.winner_id) {
      confidence += 30;
    }

    // Auto-verifiable games get bonus (+10 points)
    if (autoVerifiable) {
      confidence += 10;
    }

    return Math.min(100, Math.round(confidence));
  }

  /**
   * Store REF decision in database
   */
  async saveDecision(
    betId: string,
    decision: RefDecision,
    evidenceIds: string[]
  ): Promise<void> {
    await supabase.from('ref_decisions').insert({
      bet_id: betId,
      decision_type: decision.decision_type,
      confidence_score: decision.confidence_score,
      winner_id: decision.winner_id,
      evidence_analyzed: evidenceIds,
      reasoning: decision.reasoning,
    });
  }
}

// Export singleton instance
export const refAI = new RefAI();
