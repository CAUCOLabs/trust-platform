package callsession

import "time"

type CallSession struct {
	ID                  int64     `json:"id"`
	PhoneNumber         string    `json:"phone_number"`
	CompanyID           *int64    `json:"company_id,omitempty"`
	CompanyName         string    `json:"company_name,omitempty"`
	VerifiedNumberID    *int64    `json:"verified_number_id,omitempty"`
	VerifiedNumberPhone string    `json:"verified_number_phone,omitempty"`
	VerifiedNumberLabel string    `json:"verified_number_label,omitempty"`
	CallReasonID        *int64    `json:"call_reason_id,omitempty"`
	CallReasonTitle     string    `json:"call_reason_title,omitempty"`
	RiskLevel           string    `json:"risk_level"`
	TrustScore          int       `json:"trust_score"`
	CreatedAt           time.Time `json:"created_at"`
}

type CreateCallSessionRequest struct {
	PhoneNumber      string `json:"phone_number"`
	CompanyID        *int64 `json:"company_id,omitempty"`
	VerifiedNumberID *int64 `json:"verified_number_id,omitempty"`
	CallReasonID     *int64 `json:"call_reason_id,omitempty"`
	RiskLevel        string `json:"risk_level"`
	TrustScore       int    `json:"trust_score"`
}
