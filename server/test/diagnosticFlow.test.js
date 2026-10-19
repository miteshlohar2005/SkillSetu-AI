import test from "node:test";
import assert from "node:assert/strict";
import { CADRE_DIAGNOSTIC_PRESETS } from "../services/diagnosticAssessmentService.js";
import {
  scoreToLevel,
  levelToScore,
} from "../services/competencyCalculationService.js";

test("Diagnostic Flow - Cadre Presets Integrity", async (t) => {
  await t.test("Presets exist for major cadres and default fallback", () => {
    assert.ok(
      CADRE_DIAGNOSTIC_PRESETS["Indian Statistical Service (ISS) Officer"],
      "ISS preset must exist"
    );
    assert.ok(
      CADRE_DIAGNOSTIC_PRESETS["Subordinate Statistical Service (SSS) Officer"],
      "SSS preset must exist"
    );
    assert.ok(
      CADRE_DIAGNOSTIC_PRESETS["Field Operations Division (FOD) Investigator"],
      "FOD preset must exist"
    );
    assert.ok(CADRE_DIAGNOSTIC_PRESETS.default, "Default preset must exist");
  });

  await t.test("Every preset contains valid diagnostic quiz questions", () => {
    const validLetters = ["A", "B", "C", "D"];

    for (const [cadreName, preset] of Object.entries(CADRE_DIAGNOSTIC_PRESETS)) {
      assert.ok(preset.quiz, `Preset for ${cadreName} must have quiz definition`);
      assert.ok(
        Array.isArray(preset.quiz.questions),
        `Preset for ${cadreName} quiz.questions must be an array`
      );
      assert.ok(
        preset.quiz.questions.length >= 4,
        `Preset for ${cadreName} must have at least 4 questions (got ${preset.quiz.questions.length})`
      );

      preset.quiz.questions.forEach((q, idx) => {
        assert.ok(
          q.question && q.question.trim().length > 10,
          `Cadre ${cadreName} Q${idx + 1} must have a valid question prompt`
        );
        assert.ok(
          Array.isArray(q.options) && q.options.length === 4,
          `Cadre ${cadreName} Q${idx + 1} must have exactly 4 options`
        );
        assert.ok(
          validLetters.includes(q.correctAnswer),
          `Cadre ${cadreName} Q${idx + 1} correctAnswer must be A, B, C, or D (got ${q.correctAnswer})`
        );
        assert.ok(
          q.explanation && q.explanation.trim().length > 5,
          `Cadre ${cadreName} Q${idx + 1} must provide an explanation`
        );
        assert.ok(
          q.topic && q.topic.length > 0,
          `Cadre ${cadreName} Q${idx + 1} must define a topic`
        );
      });
    }
  });

  await t.test("Every preset contains valid diagnostic viva questions", () => {
    for (const [cadreName, preset] of Object.entries(CADRE_DIAGNOSTIC_PRESETS)) {
      assert.ok(
        Array.isArray(preset.viva),
        `Preset for ${cadreName} viva must be an array`
      );
      assert.ok(
        preset.viva.length >= 3,
        `Preset for ${cadreName} viva must contain at least 3 oral prompts (got ${preset.viva.length})`
      );

      preset.viva.forEach((v, idx) => {
        assert.ok(
          v.question && v.question.trim().length > 10,
          `Cadre ${cadreName} Viva Q${idx + 1} must have question text`
        );
        assert.ok(
          v.timeLimit && v.timeLimit > 0,
          `Cadre ${cadreName} Viva Q${idx + 1} must specify positive timeLimit in seconds`
        );
      });
    }
  });
});

test("Competency Calculation - Score and Level Conversions", async (t) => {
  await t.test("scoreToLevel correctly maps percentage ranges", () => {
    assert.equal(scoreToLevel(100), "Expert");
    assert.equal(scoreToLevel(85), "Expert");
    assert.equal(scoreToLevel(84), "Advanced");
    assert.equal(scoreToLevel(70), "Advanced");
    assert.equal(scoreToLevel(69), "Intermediate");
    assert.equal(scoreToLevel(55), "Intermediate");
    assert.equal(scoreToLevel(54), "Beginner");
    assert.equal(scoreToLevel(40), "Beginner");
    assert.equal(scoreToLevel(39), "Novice");
    assert.equal(scoreToLevel(0), "Novice");
  });

  await t.test("levelToScore returns standardized numerical benchmarks", () => {
    assert.equal(levelToScore("Expert"), 88);
    assert.equal(levelToScore("expert"), 88);
    assert.equal(levelToScore("Advanced"), 75);
    assert.equal(levelToScore("Intermediate"), 60);
    assert.equal(levelToScore("Beginner"), 45);
    assert.equal(levelToScore("Novice"), 35);
    assert.equal(levelToScore("unknown_level"), 35);
  });
});
