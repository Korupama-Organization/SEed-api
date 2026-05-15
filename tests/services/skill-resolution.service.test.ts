import { Types } from "mongoose";
import { Skill } from "../../src/models/Skill";
import { normalizeSkillName, resolveSkillIds } from "../../src/services/skill-resolution.service";

jest.mock("../../src/models/Skill", () => ({
  Skill: {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

describe("skill-resolution.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes names by trimming, collapsing spaces, and lowercasing", () => {
    expect(normalizeSkillName("  React   Native  ")).toBe("react native");
  });

  it("resolves existing ObjectId string without creating a skill", async () => {
    const skillId = new Types.ObjectId();
    (Skill.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: skillId }),
    });

    const result = await resolveSkillIds([skillId.toString()]);

    expect(result).toEqual([skillId]);
    expect(Skill.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("upserts normalized skill names and skips empty strings", async () => {
    const reactId = new Types.ObjectId();
    const nodeId = new Types.ObjectId();
    (Skill.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    (Skill.findOneAndUpdate as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: reactId })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: nodeId });

    const result = await resolveSkillIds([" React ", "", "Node.js"]);

    expect(Skill.findOneAndUpdate).toHaveBeenCalledWith(
      { normalizedName: "react" },
      { $setOnInsert: { skill_name: "React", normalizedName: "react", category: "Khác" } },
      { new: true, upsert: true },
    );
    expect(Skill.findOneAndUpdate).toHaveBeenCalledWith(
      { normalizedName: "node.js" },
      { $setOnInsert: { skill_name: "Node.js", normalizedName: "node.js", category: "Khác" } },
      { new: true, upsert: true },
    );
    expect(result).toEqual([reactId, nodeId]);
  });

  it("reuses a legacy skill that only has skill_name before upserting", async () => {
    const reactId = new Types.ObjectId();
    (Skill.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    (Skill.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({ _id: reactId });

    const result = await resolveSkillIds(["REACT"]);

    expect(Skill.findOneAndUpdate).toHaveBeenCalledWith(
      {
        normalizedName: { $exists: false },
        skill_name: /^REACT$/i,
      },
      { $set: { normalizedName: "react" } },
      { new: true },
    );
    expect(Skill.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(result).toEqual([reactId]);
  });
});
