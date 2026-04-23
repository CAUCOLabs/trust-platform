package phone

import "strings"

func Normalize(input string) string {
	s := strings.TrimSpace(input)

	replacer := strings.NewReplacer(
		" ", "",
		"-", "",
		"(", "",
		")", "",
	)
	s = replacer.Replace(s)

	if strings.HasPrefix(s, "00") {
		s = "+" + strings.TrimPrefix(s, "00")
	}

	return s
}
