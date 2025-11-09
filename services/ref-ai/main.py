"""
REF AI - Rule Engine & Future ML Service
Evaluates evidence and automatically verifies bet outcomes
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== Models ====================

class EvidenceType(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"
    NUMERIC = "numeric"
    TEXT = "text"
    GPS = "gps"
    TIMESTAMP = "timestamp"


class RuleOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    CONTAINS = "contains"
    REGEX = "regex"
    IN_RANGE = "in_range"
    IMAGE_MATCH = "image_match"
    VIDEO_CONTAINS = "video_contains"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class RuleCondition(BaseModel):
    """Single rule condition"""
    field: str
    operator: RuleOperator
    value: Any
    weight: float = 1.0  # For weighted scoring


class BetRule(BaseModel):
    """Complete bet rule definition"""
    rule_id: str
    name: str
    description: str
    conditions: List[RuleCondition]
    evidence_required: List[EvidenceType]
    auto_verify: bool = True
    min_confidence: float = 0.8  # Minimum confidence for auto-verification


class EvidenceSubmission(BaseModel):
    """Evidence submitted for verification"""
    bet_id: str
    user_id: str
    evidence_type: EvidenceType
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VerificationResult(BaseModel):
    """Result of evidence verification"""
    bet_id: str
    status: VerificationStatus
    confidence: float
    matched_conditions: List[str]
    failed_conditions: List[str]
    requires_manual_review: bool
    notes: str


# ==================== Rule Engine ====================

class RuleEngine:
    """
    Core rule evaluation engine
    Evaluates evidence against bet rules
    """

    def __init__(self):
        self.rules_cache: Dict[str, BetRule] = {}

    async def load_rule(self, rule_id: str) -> Optional[BetRule]:
        """Load rule from database or cache"""
        # TODO: Implement database loading
        return self.rules_cache.get(rule_id)

    async def evaluate_numeric(
        self,
        condition: RuleCondition,
        value: float
    ) -> tuple[bool, float]:
        """Evaluate numeric conditions"""
        try:
            if condition.operator == RuleOperator.EQUALS:
                match = abs(value - float(condition.value)) < 0.01
                confidence = 1.0 if match else 0.0

            elif condition.operator == RuleOperator.GREATER_THAN:
                match = value > float(condition.value)
                confidence = 1.0 if match else 0.0

            elif condition.operator == RuleOperator.LESS_THAN:
                match = value < float(condition.value)
                confidence = 1.0 if match else 0.0

            elif condition.operator == RuleOperator.IN_RANGE:
                min_val, max_val = condition.value
                match = min_val <= value <= max_val
                confidence = 1.0 if match else 0.0

            else:
                return False, 0.0

            return match, confidence

        except Exception as e:
            logger.error(f"Numeric evaluation error: {e}")
            return False, 0.0

    async def evaluate_image(
        self,
        condition: RuleCondition,
        image_path: str
    ) -> tuple[bool, float]:
        """
        Evaluate image evidence
        TODO: Integrate ML model for image analysis
        """
        # Placeholder for future ML integration
        logger.info(f"Image evaluation requested for: {image_path}")

        # For now, return needs manual review
        return False, 0.5

    async def evaluate_video(
        self,
        condition: RuleCondition,
        video_path: str
    ) -> tuple[bool, float]:
        """
        Evaluate video evidence
        TODO: Integrate ML model for video analysis
        """
        logger.info(f"Video evaluation requested for: {video_path}")

        # Placeholder for future ML integration
        return False, 0.5

    async def evaluate_gps(
        self,
        condition: RuleCondition,
        lat: float,
        lng: float
    ) -> tuple[bool, float]:
        """Evaluate GPS coordinates"""
        # Check if within specified radius
        if condition.operator == RuleOperator.IN_RANGE:
            target_lat, target_lng, radius_km = condition.value

            # Simple distance calculation (Haversine would be better)
            distance = ((lat - target_lat)**2 + (lng - target_lng)**2)**0.5 * 111

            match = distance <= radius_km
            confidence = 1.0 if match else max(0.0, 1.0 - (distance / radius_km))

            return match, confidence

        return False, 0.0

    async def verify_evidence(
        self,
        rule: BetRule,
        evidence: EvidenceSubmission
    ) -> VerificationResult:
        """
        Main verification method
        Evaluates evidence against all rule conditions
        """
        matched = []
        failed = []
        total_confidence = 0.0
        total_weight = 0.0

        for condition in rule.conditions:
            match = False
            confidence = 0.0

            # Route to appropriate evaluator
            if evidence.evidence_type == EvidenceType.NUMERIC:
                value = evidence.data.get(condition.field)
                if value is not None:
                    match, confidence = await self.evaluate_numeric(condition, value)

            elif evidence.evidence_type == EvidenceType.GPS:
                lat = evidence.data.get('latitude')
                lng = evidence.data.get('longitude')
                if lat is not None and lng is not None:
                    match, confidence = await self.evaluate_gps(condition, lat, lng)

            elif evidence.evidence_type == EvidenceType.PHOTO:
                image_path = evidence.data.get('file_path')
                if image_path:
                    match, confidence = await self.evaluate_image(condition, image_path)

            elif evidence.evidence_type == EvidenceType.VIDEO:
                video_path = evidence.data.get('file_path')
                if video_path:
                    match, confidence = await self.evaluate_video(condition, video_path)

            # Track results
            total_confidence += confidence * condition.weight
            total_weight += condition.weight

            if match:
                matched.append(condition.field)
            else:
                failed.append(condition.field)

        # Calculate final confidence
        final_confidence = total_confidence / total_weight if total_weight > 0 else 0.0

        # Determine status
        if final_confidence >= rule.min_confidence and rule.auto_verify:
            status = VerificationStatus.VERIFIED
            requires_review = False
        elif final_confidence < 0.3:
            status = VerificationStatus.REJECTED
            requires_review = False
        else:
            status = VerificationStatus.NEEDS_REVIEW
            requires_review = True

        return VerificationResult(
            bet_id=evidence.bet_id,
            status=status,
            confidence=final_confidence,
            matched_conditions=matched,
            failed_conditions=failed,
            requires_manual_review=requires_review,
            notes=f"Evaluated {len(rule.conditions)} conditions"
        )


# ==================== FastAPI App ====================

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Startup and shutdown events"""
    logger.info("🤖 REF AI Service starting...")
    # Initialize rule engine
    app.state.rule_engine = RuleEngine()
    logger.info("✅ REF AI Service ready")
    yield
    logger.info("👋 REF AI Service shutting down")


app = FastAPI(
    title="Betcha REF AI Service",
    description="Rule Engine and Future ML Service for automatic bet verification",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Endpoints ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ref-ai",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/verify", response_model=VerificationResult)
async def verify_evidence(
    bet_id: str = Form(...),
    user_id: str = Form(...),
    rule_id: str = Form(...),
    evidence_type: EvidenceType = Form(...),
    data: str = Form(...),  # JSON string
):
    """
    Verify evidence against bet rules
    """
    import json

    # Parse evidence data
    try:
        evidence_data = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid evidence data")

    # Load rule
    rule = await app.state.rule_engine.load_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Create evidence submission
    evidence = EvidenceSubmission(
        bet_id=bet_id,
        user_id=user_id,
        evidence_type=evidence_type,
        data=evidence_data
    )

    # Verify
    result = await app.state.rule_engine.verify_evidence(rule, evidence)

    return result


@app.post("/upload-evidence")
async def upload_evidence(
    file: UploadFile = File(...),
    bet_id: str = Form(...),
    evidence_type: EvidenceType = Form(...),
):
    """
    Upload evidence file (photo/video)
    TODO: Integrate with S3 storage
    """
    # Save file temporarily
    file_path = f"/tmp/{bet_id}_{file.filename}"

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    logger.info(f"Evidence uploaded: {file_path}")

    return {
        "file_path": file_path,
        "size": len(content),
        "type": evidence_type
    }


@app.post("/rules", response_model=BetRule)
async def create_rule(rule: BetRule):
    """Create a new bet rule"""
    # Store in cache (TODO: save to database)
    app.state.rule_engine.rules_cache[rule.rule_id] = rule

    logger.info(f"Rule created: {rule.rule_id}")

    return rule


@app.get("/rules/{rule_id}", response_model=BetRule)
async def get_rule(rule_id: str):
    """Get rule by ID"""
    rule = await app.state.rule_engine.load_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


# ==================== ML Integration (Future) ====================

@app.post("/ml/analyze-image")
async def analyze_image_ml(file: UploadFile = File(...)):
    """
    ML-powered image analysis
    TODO: Integrate TensorFlow/PyTorch model
    """
    return {
        "status": "not_implemented",
        "message": "ML model integration coming soon",
        "capabilities": [
            "Object detection",
            "Scene classification",
            "OCR (text extraction)",
            "Face detection",
            "Activity recognition"
        ]
    }


@app.post("/ml/analyze-video")
async def analyze_video_ml(file: UploadFile = File(...)):
    """
    ML-powered video analysis
    TODO: Integrate video analysis model
    """
    return {
        "status": "not_implemented",
        "message": "ML model integration coming soon",
        "capabilities": [
            "Action recognition",
            "Event detection",
            "Highlight extraction",
            "Score detection",
            "Performance metrics"
        ]
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
