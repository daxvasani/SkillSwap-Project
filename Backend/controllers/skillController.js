// controllers/skillController.js

const Skill = require("../models/Skill");
const User = require("../models/User");

// GET /api/skills?search=&category=&college=
exports.getSkills = async (req, res) => {
  try {
    const { search, category, college } = req.query;
    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (college) {
      query.college = college;
    }

    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive partial match
      query.$or = [{ skill: regex }, { tags: regex }, { description: regex }];
    }

    const skills = await Skill.find(query)
      .populate("userId", "firstName lastName college year avgRating")
      .sort({ createdAt: -1 });

    res.status(200).json({ skills });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// GET /api/skills/:id
exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).populate(
      "userId",
      "firstName lastName college year avgRating"
    );
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    res.status(200).json({ skill });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// POST /api/skills   (protected)
exports.createSkill = async (req, res) => {
  try {
    const { skill, description, category, tags } = req.body;

    if (!skill || !description || !category) {
      return res.status(400).json({ message: "Skill, description and category are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newSkill = await Skill.create({
      userId: user._id,
      skill,
      description,
      category,
      tags: Array.isArray(tags) ? tags : [],
      college: user.college,
      year: user.year
    });

    res.status(201).json({ message: "Skill posted successfully", skill: newSkill });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/skills/:id   (protected — only the owner can edit)
exports.updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    if (skill.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own skill listings" });
    }

    const { skill: skillName, description, category, tags } = req.body;
    if (skillName !== undefined) skill.skill = skillName;
    if (description !== undefined) skill.description = description;
    if (category !== undefined) skill.category = category;
    if (tags !== undefined) skill.tags = tags;

    await skill.save();
    res.status(200).json({ message: "Skill updated successfully", skill });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// DELETE /api/skills/:id   (protected — only the owner can delete)
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    if (skill.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own skill listings" });
    }

    await skill.deleteOne();
    res.status(200).json({ message: "Skill deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};
