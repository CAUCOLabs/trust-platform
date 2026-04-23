package verifiednumber

import "time"

type VerifiedNumber struct {
	ID          int64     `json:"id"`
	CompanyID   int64     `json:"company_id"`
	PhoneNumber string    `json:"phone_number"`
	Label       string    `json:"label"`
	Verified    bool      `json:"verified"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateVerifiedNumberRequest struct {
	CompanyID   int64  `json:"company_id"`
	PhoneNumber string `json:"phone_number"`
	Label       string `json:"label"`
}

type LookupResponse struct {
	Found       bool   `json:"found"`
	PhoneNumber string `json:"phone_number"`
	CompanyID   int64  `json:"company_id,omitempty"`
	CompanyName string `json:"company_name,omitempty"`
	Label       string `json:"label,omitempty"`
	Verified    bool   `json:"verified"`
}
