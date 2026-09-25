'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { trustService, type NewReviewSubmission } from '@/modules/provider/trust.service';
import { type VerifiedStay } from '@/modules/destination/seed';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Star, 
  TrendingUp, 
  FileCode, 
  AlertCircle
} from 'lucide-react';
import './Trust.css';

export default function Trust() {
  const { selectedDestination, demoReviews, recordDemoReview } = useApp();
  const [stays, setStays] = useState<VerifiedStay[]>([]);
  const [activeStay, setActiveStay] = useState<VerifiedStay | null>(null);
  
  // Review form state
  const [token, setToken] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Traveller Arjun');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('Write about your experience here. This is an illustrative demo submission.');
  const [pricePaid, setPricePaid] = useState<number>(4200);
  const [submissionStatus, setSubmissionStatus] = useState<{
    submitted: boolean;
    success: boolean;
    message: string;
    demoReference?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedReview = activeStay ? demoReviews.find((review) => review.stayId === activeStay.id) : undefined;

  useEffect(() => {
    trustService.getVerifiedStays(selectedDestination.id).then((res) => {
      setStays(res);
      if (res.length > 0) setActiveStay(res[0]);
    });
  }, [selectedDestination.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStay) return;

    const payload: NewReviewSubmission = {
      destinationId: selectedDestination.id,
      stayId: activeStay.id,
      bookingVerificationToken: token,
      authorName,
      rating,
      comment,
      pricePaidInr: pricePaid,
    };

    if (submittedReview || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await trustService.submitVerifiedReview(payload);
      if (res.success && res.demoReference) {
        const recorded = recordDemoReview({
          stayId: activeStay.id,
          authorName,
          rating,
          comment,
          pricePaidInr: pricePaid,
          submittedAt: new Date().toISOString(),
          demoReference: res.demoReference,
        });
        setSubmissionStatus({ submitted: true, success: recorded, message: recorded ? res.message : 'A demo review has already been submitted for this stay.', demoReference: res.demoReference });
      } else {
        setSubmissionStatus({ submitted: true, success: false, message: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="trust-page">
      {/* Header */}
      <div className="trust-header">
        <div>
          <div className="badge-row">
            <span className="pill-badge pill-purple">
              <Sparkles size={14} /> Trust workflow · demo simulation
            </span>
            <span className="pill-badge pill-green">
              <ShieldCheck size={14} /> Verification fixtures
            </span>
          </div>
          <h2>Example Stays, Artisans & Review Eligibility</h2>
          <p className="subtitle">
            Combating fake reviews with tokenized check-in verification and transparent seasonal pricing history.
          </p>
        </div>
      </div>

      <div className="trust-layout-grid">
        {/* Left Column: Verified Stays & Price Transparency */}
        <div className="stays-column">
          <div className="stays-header-box glass-panel">
            <div className="stay-title-row">
              <div>
            <span className="sub-label">ILLUSTRATIVE PARTNER FIXTURES (FR-TRUST-01)</span>
                <h3>Example Provider Listings</h3>
              </div>
              <HeartHandshake size={20} className="text-purple" />
            </div>
            <p className="stay-sub">
              Example partner records for the demo. Verification claims are not connected to an authority.
            </p>
          </div>

          <div className="stays-list">
            {stays.map((stay) => (
              <div 
                key={stay.id} 
                className={`stay-card glass-panel ${activeStay?.id === stay.id ? 'active-stay-card' : ''}`}
                onClick={() => setActiveStay(stay)}
              >
                <div className="stay-top">
                  <div>
                    <span className="stay-type">{stay.type}</span>
                    <h4>{stay.name}</h4>
                    <span className="stay-host">Host: <strong>{stay.hostName}</strong></span>
                  </div>
                  <div className="stay-price-tag">
                    <strong>₹{stay.pricePerNightInr}</strong>
                    <small>/night</small>
                  </div>
                </div>

                <div className="verification-pills">
                  <span className="badge-gov-ver">
                    <ShieldCheck size={12} /> Demo fixture · verification not connected
                  </span>
                  <span className="badge-sustain">
                    {stay.sustainabilityRating}/100 Eco Score
                  </span>
                </div>

                {/* Price Transparency History */}
                <div className="price-history-box">
                  <div className="price-hist-head">
                    <TrendingUp size={14} className="text-secondary" />
                    <span>Price Transparency (Seasonal Rate History)</span>
                  </div>
                  <div className="price-bars">
                    {stay.priceHistory.map((ph, pi) => (
                      <div className="price-bar-col" key={pi}>
                        <span className="p-amt">₹{ph.price}</span>
                        <div 
                          className="p-bar-fill" 
                          style={{ height: `${(ph.price / 5000) * 40}px` }}
                        ></div>
                        <span className="p-month">{ph.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Ledger Proof */}
                <div className="audit-hash-row">
                  <FileCode size={12} className="text-secondary" />
                  <span>Demo record reference: <code>{stay.auditHash}</code></span>
                </div>
              </div>
            ))}
          </div>

          {/* Existing Verified Reviews */}
          {activeStay && (
            <div className="reviews-card glass-panel">
              <div className="rev-head">
                <h4>Illustrative Reviews for {activeStay.name}</h4>
                <div className="rev-stat">
                  <Star size={14} className="text-gold" />
                    <strong>{activeStay.averageRating}</strong> ({activeStay.reviewCount} illustrative reviews)
                </div>
              </div>

              <div className="rev-list">
                {activeStay.reviews.map((rev) => (
                  <div className="rev-item" key={rev.id}>
                    <div className="rev-top">
                      <span className="rev-author">{rev.author}</span>
                      <span className="rev-date">{rev.date}</span>
                    </div>
                    <p className="rev-comment">"{rev.comment}"</p>
                    <div className="rev-hash">
                      <Lock size={12} className="text-green" />
                      <span>Illustrative review reference: {rev.hashProof}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Verified Review Submission Simulation (Anti-Fraud Gate) */}
        <div className="review-form-column">
          <div className="review-form-card glass-panel">
            <div className="form-card-head">
              <div>
                <span className="sub-label">ANTI-FRAUD PROTOCOL (FR-TRUST-02)</span>
              <h3>Submit a Demo Review</h3>
              </div>
              <Lock size={20} className="text-green" />
            </div>

            <p className="form-desc">
              This demo accepts only the exact fixture token for the selected stay. It does not verify real check-ins or write to a tamper-evident ledger.
            </p>

            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group">
                <label>Completed-stay demo token *</label>
                <div className="token-input-wrap">
                  <input 
                    type="text" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="e.g. YS-AHM-9921"
                    required
                  />
                  <span className={`token-valid-tag ${activeStay && token.trim().toUpperCase() === trustService.demoTokenForStay(activeStay.id) ? '' : 'token-invalid-tag'}`}>
                    {activeStay && token.trim().toUpperCase() === trustService.demoTokenForStay(activeStay.id) ? <><CheckCircle2 size={12} /> Demo eligible</> : <><AlertCircle size={12} /> Not eligible</>}
                  </span>
                </div>
                <small className="hint">Use this illustrative completed-stay token: {activeStay ? trustService.demoTokenForStay(activeStay.id) : 'Select a stay first'}. Other values are blocked.</small>
              </div>

              <div className="form-group">
                <label>Your Name / Handle</label>
                <input 
                  type="text" 
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Experience Rating</label>
                <div className="rating-select">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`star-btn ${rating >= s ? 'star-active' : ''}`}
                      onClick={() => setRating(s)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-num">{rating} / 5 Stars</span>
                </div>
              </div>

              <div className="form-group">
                <label>Observed Ground Experience & Notes</label>
                <textarea 
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details regarding crowd, noise, cleanliness, and local support..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Actual Price Paid (INR)</label>
                <input 
                  type="number" 
                  value={pricePaid}
                  onChange={(e) => setPricePaid(Number(e.target.value))}
                  required
                />
              </div>

              <button type="submit" className="btn-submit-review" disabled={isSubmitting || Boolean(submittedReview)}>
                <ShieldCheck size={16} />
                <span>{isSubmitting ? 'Saving demo review…' : submittedReview ? 'Demo review saved' : 'Save demo review (+250 Yatra Points)'}</span>
              </button>
            </form>

            {submittedReview && (
              <div className="submission-result res-success">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Your locally saved demo review</strong>
                  <p>{submittedReview.rating}/5 · {submittedReview.comment}</p>
                  <div className="proof-code">
                    <span>Demo reference:</span> <code>{submittedReview.demoReference}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Feedback Result */}
            {submissionStatus && (
              <div className={`submission-result ${submissionStatus.success ? 'res-success' : 'res-error'}`}>
                {submissionStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <div>
                  <strong>{submissionStatus.message}</strong>
                  {submissionStatus.demoReference && (
                    <div className="proof-code">
                      <span>Demo reference:</span> <code>{submissionStatus.demoReference}</code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
