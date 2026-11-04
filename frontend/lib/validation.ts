export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type SignInValues = {
  email: string;
  password: string;
};

export type SignUpValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type SignInErrors = Partial<Record<keyof SignInValues, string>>;
export type SignUpErrors = Partial<
  Record<keyof SignUpValues | "terms", string>
>;

export function validateSignIn(values: SignInValues): SignInErrors {
  const errors: SignInErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter your work email.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Enter your full name.";
  } else if (values.fullName.trim().split(/\s+/).length < 2) {
    errors.fullName = "Enter your first and last name.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your work email.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const phoneDigits = values.phone.replace(/\D/g, "");
  if (values.phone.trim() && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!values.password) {
    errors.password = "Create a password.";
  } else if (values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Re-enter your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
