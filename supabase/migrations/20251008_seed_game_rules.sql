-- =============================================
-- BETCHA SEED DATA - GAME RULES
-- Populates initial game rules templates
-- Date: 2025-10-08
-- =============================================

-- NOTE: The full 100 game rules are stored in src/data/gameRules.json
-- This seed file contains a representative sample for database initialization

INSERT INTO public.game_rules (name, category, description, rules, is_custom, created_by) VALUES

-- Sports (Sample)
('Basketball 1v1', 'sports', 'First to 21 points wins',
 '{"inputs": [{"name": "points_to_win", "type": "number", "default": 21}], "win_condition": {"type": "first_to_score"}, "evidence_required": ["video", "score_sheet"]}',
 false, NULL),

('Soccer Penalty Shootout', 'sports', 'Best of 5 penalties',
 '{"inputs": [{"name": "rounds", "type": "number", "default": 5}], "win_condition": {"type": "most_goals"}, "evidence_required": ["video"]}',
 false, NULL),

('5K Running Race', 'sports', 'Fastest time wins',
 '{"inputs": [{"name": "distance", "type": "number", "default": 5}], "win_condition": {"type": "fastest_time"}, "evidence_required": ["gps_track"]}',
 false, NULL),

-- Board Games (Sample)
('Chess Match', 'board_games', 'Checkmate or resignation wins',
 '{"inputs": [{"name": "time_control", "type": "select", "default": "10+0"}], "win_condition": {"type": "checkmate_or_resign"}, "evidence_required": ["game_link"]}',
 false, NULL),

('Scrabble', 'board_games', 'Highest word score wins',
 '{"inputs": [{"name": "time_per_turn", "type": "number", "default": 120}], "win_condition": {"type": "highest_score"}, "evidence_required": ["board_photo", "score_sheet"]}',
 false, NULL),

('Connect Four', 'board_games', 'First to get four in a row wins',
 '{"inputs": [{"name": "games", "type": "number", "default": 3}], "win_condition": {"type": "four_in_row"}, "evidence_required": ["photo"]}',
 false, NULL),

-- Card Games (Sample)
('Poker - Heads Up', 'card_games', 'Eliminate opponent to win all chips',
 '{"inputs": [{"name": "starting_chips", "type": "number", "default": 1000}], "win_condition": {"type": "eliminate_opponent"}, "evidence_required": ["game_screenshot"]}',
 false, NULL),

('UNO', 'card_games', 'First to empty hand wins round, first to 500 points wins game',
 '{"inputs": [{"name": "target_score", "type": "number", "default": 500}], "win_condition": {"type": "first_to_score"}, "evidence_required": ["score_sheet"]}',
 false, NULL),

-- Word Games (Sample)
('Spelling Bee', 'word_games', 'Spell most words correctly',
 '{"inputs": [{"name": "rounds", "type": "number", "default": 10}, {"name": "difficulty", "type": "select", "default": "medium"}], "win_condition": {"type": "most_correct"}, "evidence_required": ["video", "score_sheet"]}',
 false, NULL),

('Boggle', 'word_games', 'Find most unique words in letter grid',
 '{"inputs": [{"name": "rounds", "type": "number", "default": 3}], "win_condition": {"type": "most_unique_words"}, "evidence_required": ["word_list"]}',
 false, NULL),

-- Video Games (Sample)
('FIFA Match', 'video_games', 'Score most goals to win',
 '{"inputs": [{"name": "match_length", "type": "select", "default": "6 min"}], "win_condition": {"type": "most_goals"}, "evidence_required": ["final_score_screenshot"]}',
 false, NULL),

('Call of Duty 1v1', 'video_games', 'First to target kills wins',
 '{"inputs": [{"name": "kills_to_win", "type": "number", "default": 20}], "win_condition": {"type": "first_to_kills"}, "evidence_required": ["final_scoreboard"]}',
 false, NULL),

('Mario Kart Race', 'video_games', 'Best total placement across races',
 '{"inputs": [{"name": "races", "type": "number", "default": 3}], "win_condition": {"type": "best_total_placement"}, "evidence_required": ["results_screen"]}',
 false, NULL),

-- Physical Challenges (Sample)
('Push-up Contest', 'physical', 'Do the most push-ups in time limit',
 '{"inputs": [{"name": "time_limit", "type": "number", "default": 2}], "win_condition": {"type": "most_reps"}, "evidence_required": ["video", "rep_count"]}',
 false, NULL),

('Plank Hold', 'physical', 'Hold plank position longest',
 '{"inputs": [{"name": "plank_type", "type": "select", "default": "forearm"}], "win_condition": {"type": "longest_time"}, "evidence_required": ["video", "timer"]}',
 false, NULL),

('Pull-up Max', 'physical', 'Do the most pull-ups until failure',
 '{"inputs": [{"name": "grip_type", "type": "select", "default": "overhand"}], "win_condition": {"type": "most_reps"}, "evidence_required": ["video"]}',
 false, NULL),

-- Spoken Word (Sample)
('Debate Competition', 'spoken_word', 'Formal debate judged by panel',
 '{"inputs": [{"name": "format", "type": "select", "default": "Oxford"}, {"name": "time_per_speaker", "type": "number", "default": 5}], "win_condition": {"type": "judge_decision"}, "evidence_required": ["video", "judge_scores"]}',
 false, NULL),

('Rap Battle', 'spoken_word', 'Freestyle rap battle, best performance wins',
 '{"inputs": [{"name": "rounds", "type": "number", "default": 3}], "win_condition": {"type": "judge_or_crowd_vote"}, "evidence_required": ["video", "votes"]}',
 false, NULL),

('Roast Battle', 'spoken_word', 'Comedy roast battle, funniest wins',
 '{"inputs": [{"name": "rounds", "type": "number", "default": 3}], "win_condition": {"type": "judge_or_crowd_vote"}, "evidence_required": ["video", "votes"]}',
 false, NULL);

-- =============================================
-- SEED DATA COMPLETE
-- Note: Additional game rules can be dynamically loaded from gameRules.json
-- =============================================
