import { Company } from "../../src/models/Company";
import { listCompanies } from "../../src/services/company-onboarding.service";

jest.mock("../../src/models/Company", () => ({
  Company: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe("listCompanies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paginated public company info with search filter", async () => {
    const companies = [
      {
        _id: "company-2",
        name: "SEeds Technology",
        shortName: "SEeds",
        websiteUrl: "https://seeds.example.com",
        email: "hr@seeds.example.com",
        location: [{ city: "Ho Chi Minh", address: "Thu Duc", country: "Vietnam" }],
      },
    ];

    const limitMock = jest.fn().mockResolvedValue(companies);
    const skipMock = jest.fn(() => ({ limit: limitMock }));
    const sortMock = jest.fn(() => ({ skip: skipMock }));
    (Company.find as jest.Mock).mockReturnValue({ sort: sortMock });
    (Company.countDocuments as jest.Mock).mockResolvedValue(3);

    const result = await listCompanies({
      page: "2",
      limit: "1",
      search: "seed",
    });

    expect(Company.find).toHaveBeenCalledWith({
      $or: [
        { name: /seed/i },
        { shortName: /seed/i },
        { websiteUrl: /seed/i },
        { email: /seed/i },
        { "location.city": /seed/i },
      ],
    });
    expect(Company.countDocuments).toHaveBeenCalledWith({
      $or: [
        { name: /seed/i },
        { shortName: /seed/i },
        { websiteUrl: /seed/i },
        { email: /seed/i },
        { "location.city": /seed/i },
      ],
    });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(skipMock).toHaveBeenCalledWith(1);
    expect(limitMock).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      companies,
      pagination: {
        page: 2,
        limit: 1,
        total: 3,
        totalPages: 3,
      },
    });
  });
});
