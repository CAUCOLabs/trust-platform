package callreason

import "time"

type CallReason struct {
	ID          int64      `json:"id"`
	CompanyID   int64      `json:"company_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Active      bool       `json:"active"`
	Priority    string     `json:"priority"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type CreateCallReasonRequest struct {
	CompanyID   int64   `json:"company_id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Priority    string  `json:"priority"`
	ExpiresAt   *string `json:"expires_at,omitempty"`
}
