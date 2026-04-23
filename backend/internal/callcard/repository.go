package callcard

import (
	"context"
	"time"

	"github.com/cauco/trust-platform/backend/internal/verifiednumber"
)

type Repository struct {
	verifiedNumberRepo *verifiednumber.Repository
}

func NewRepository(verifiedNumberRepo *verifiednumber.Repository) *Repository {
	return &Repository{verifiedNumberRepo: verifiedNumberRepo}
}

func (r *Repository) Build(ctx context.Context, phoneNumber string) (Response, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	lookup, err := r.verifiedNumberRepo.LookupByPhoneNumber(ctx, phoneNumber)
	if err != nil {
		return Response{}, err
	}

	if !lookup.Found {
		return Response{
			Found:          false,
			PhoneNumber:    lookup.PhoneNumber,
			Verified:       false,
			TrustScore:     0,
			RiskLevel:      "high",
			SpamReports:    0,
			LookupCount:    0,
			Recommendation: "Do not trust this caller",
		}, nil
	}

	resp := Response{
		Found:          true,
		PhoneNumber:    lookup.PhoneNumber,
		CompanyName:    lookup.CompanyName,
		Label:          lookup.Label,
		Verified:       lookup.Verified,
		TrustScore:     lookup.TrustScore,
		SpamReports:    lookup.SpamReports,
		LookupCount:    lookup.LookupCount,
		RiskLevel:      riskLevelFromScore(lookup.TrustScore, lookup.SpamReports, lookup.Verified),
		Recommendation: recommendationFromScore(lookup.TrustScore, lookup.SpamReports, lookup.Verified),
	}

	if lookup.CallReason != nil {
		resp.ReasonTitle = lookup.CallReason.Title
		resp.ReasonDescription = lookup.CallReason.Description
		resp.Priority = lookup.CallReason.Priority
	}

	return resp, nil
}

func riskLevelFromScore(score int, spamReports int, verified bool) string {
	if !verified {
		return "high"
	}

	if spamReports >= 3 || score < 50 {
		return "high"
	}

	if spamReports >= 1 || score < 90 {
		return "medium"
	}

	return "low"
}

func recommendationFromScore(score int, spamReports int, verified bool) string {
	if !verified {
		return "Do not trust this caller"
	}

	if spamReports >= 3 || score < 50 {
		return "Likely suspicious"
	}

	if spamReports >= 1 || score < 90 {
		return "Exercise caution"
	}

	return "Trusted caller"
}
