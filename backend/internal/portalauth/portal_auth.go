package portalauth

import "time"

const (
	AccountTypePersonal = "personal"
	AccountTypeBusiness = "business"
)

type Account struct {
	ID          int64           `json:"id"`
	AccountType string          `json:"account_type"`
	Email       string          `json:"email"`
	FullName    string          `json:"full_name"`
	PhoneNumber string          `json:"phone_number"`
	Company     *CompanySummary `json:"company,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
}

type CompanySummary struct {
	ID                    int64  `json:"id"`
	Name                  string `json:"name"`
	BusinessID            string `json:"business_id"`
	PhoneNumber           string `json:"phone_number"`
	Verified              bool   `json:"verified"`
	VerifiedNumberCount   int    `json:"verified_number_count"`
	ActiveCallReasonCount int    `json:"active_call_reason_count"`
}

type Session struct {
	Token     string    `json:"token"`
	Account   Account   `json:"account"`
	ExpiresAt time.Time `json:"expires_at"`
}

type BusinessWorkspace struct {
	Company         BusinessWorkspaceCompany          `json:"company"`
	VerifiedNumbers []BusinessWorkspaceVerifiedNumber `json:"verified_numbers"`
	CallReasons     []BusinessWorkspaceCallReason     `json:"call_reasons"`
}

type BusinessWorkspaceCompany struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	BusinessID  string    `json:"business_id"`
	PhoneNumber string    `json:"phone_number"`
	Verified    bool      `json:"verified"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type BusinessWorkspaceVerifiedNumber struct {
	ID          int64     `json:"id"`
	CompanyID   int64     `json:"company_id"`
	PhoneNumber string    `json:"phone_number"`
	Label       string    `json:"label"`
	Verified    bool      `json:"verified"`
	CreatedAt   time.Time `json:"created_at"`
}

type BusinessWorkspaceCallReason struct {
	ID          int64      `json:"id"`
	CompanyID   int64      `json:"company_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Active      bool       `json:"active"`
	Priority    string     `json:"priority"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type personalSignupRequest struct {
	FullName    string `json:"full_name"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phone_number"`
	Password    string `json:"password"`
}

type businessSignupRequest struct {
	FullName    string `json:"full_name"`
	WorkEmail   string `json:"work_email"`
	Password    string `json:"password"`
	CompanyName string `json:"company_name"`
	BusinessID  string `json:"business_id"`
	PhoneNumber string `json:"phone_number"`
}

type signInRequest struct {
	AccountType string `json:"account_type"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

type updateBusinessCompanyRequest struct {
	Name        string `json:"name"`
	BusinessID  string `json:"business_id"`
	PhoneNumber string `json:"phone_number"`
}

type createBusinessVerifiedNumberRequest struct {
	PhoneNumber string `json:"phone_number"`
	Label       string `json:"label"`
}

type createBusinessCallReasonRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Priority    string  `json:"priority"`
	ExpiresAt   *string `json:"expires_at,omitempty"`
}
