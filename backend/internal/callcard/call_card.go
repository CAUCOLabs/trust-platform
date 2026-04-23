package callcard

type Response struct {
	Found             bool   `json:"found"`
	PhoneNumber       string `json:"phone_number"`
	CompanyName       string `json:"company_name,omitempty"`
	Label             string `json:"label,omitempty"`
	Verified          bool   `json:"verified"`
	TrustScore        int    `json:"trust_score"`
	RiskLevel         string `json:"risk_level"`
	SpamReports       int    `json:"spam_reports"`
	LookupCount       int    `json:"lookup_count"`
	ReasonTitle       string `json:"reason_title,omitempty"`
	ReasonDescription string `json:"reason_description,omitempty"`
	Priority          string `json:"priority,omitempty"`
	Recommendation    string `json:"recommendation"`
}
