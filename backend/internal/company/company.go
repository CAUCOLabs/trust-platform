package company

import "time"

type Company struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	BusinessID  string    `json:"business_id"`
	PhoneNumber string    `json:"phone_number"`
	Verified    bool      `json:"verified"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateCompanyRequest struct {
	Name        string `json:"name"`
	BusinessID  string `json:"business_id"`
	PhoneNumber string `json:"phone_number"`
}

type UpdateCompanyRequest struct {
	Name        string `json:"name"`
	BusinessID  string `json:"business_id"`
	PhoneNumber string `json:"phone_number"`
}
