type CompanyLike = {
  status?: string | null;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: string | Date | null;
};

export function hasActiveSubscription(company?: CompanyLike | null) {
  if (!company) {
    return false;
  }

  if (company.status !== "active") {
    return false;
  }

  if (company.subscriptionStatus !== "active") {
    return false;
  }

  if (!company.subscriptionEndsAt) {
    return false;
  }

  return new Date(company.subscriptionEndsAt).getTime() > Date.now();
}

export function getSubscriptionLabel(company?: CompanyLike | null) {
  if (!company) {
    return "No company";
  }

  if (company.status !== "active") {
    return "Suspended";
  }

  switch (company.subscriptionStatus) {
    case "active":
      return hasActiveSubscription(company) ? "Active" : "Expired";
    case "expired":
      return "Expired";
    case "pending":
      return "Payment required";
    case "cancelled":
      return "Cancelled";
    default:
      return "Payment required";
  }
}
