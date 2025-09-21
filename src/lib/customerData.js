// Customer data simulation
export const customers = {
  "CK-0001": {
    id: "CK-0001",
    name: "John Smith",
    points: 1250,
    memberSince: "2024-01-15",
    tier: "Gold",
  },
  "CK-0002": {
    id: "CK-0002",
    name: "Sarah Johnson",
    points: 850,
    memberSince: "2024-03-20",
    tier: "Silver",
  },
  "CK-0003": {
    id: "CK-0003",
    name: "Mike Wilson",
    points: 2340,
    memberSince: "2023-11-10",
    tier: "Platinum",
  },
  "CK-0004": {
    id: "CK-0004",
    name: "Emily Davis",
    points: 450,
    memberSince: "2024-06-05",
    tier: "Bronze",
  },
  "CK-0005": {
    id: "CK-0005",
    name: "David Brown",
    points: 1890,
    memberSince: "2024-02-12",
    tier: "Gold",
  },
};

export const getTierColor = (tier) => {
  switch (tier) {
    case "Platinum":
      return "text-purple-600 bg-purple-100";
    case "Gold":
      return "text-yellow-600 bg-yellow-100";
    case "Silver":
      return "text-gray-600 bg-gray-100";
    case "Bronze":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export const getCustomer = (customerId) => {
  return customers[customerId] || null;
};
