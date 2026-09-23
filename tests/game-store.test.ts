import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/game-store";
import { TriviaQuestion } from "@/interfaces/game-types";
import { TriviaTopic } from "@/interfaces/trivia";
import { buildStratifiedMapQuestions } from "@/lib/level-hydrator";

const mockQuestion = (
  id: number,
  topic_id = "test-topic",
  global_index = id,
  electoral_district_id?: string,
): TriviaQuestion => ({
  id,
  topic_id,
  quote: `Pregunta de prueba ${id}`,
  title: `Título ${id}`,
  category: "GENERAL",
  difficulty: "FACIL",
  display_type: "TEXT_ONLY",
  correct_answer_id: "opt_1",
  global_index,
  electoral_district_id,
  options: [
    { option_id: "opt_1", name: "Opción A", is_correct: true, letter: "A" },
    { option_id: "opt_2", name: "Opción B", is_correct: false, letter: "B" },
  ],
});

describe("Game Store - Level Progression & Unlocking Invariants", () => {
  beforeEach(() => {
    useGameStore.getState().resetProgress();
  });

  it("starts at level 1 with empty progress and 0 XP", () => {
    const state = useGameStore.getState();
    expect(state.highestUnlockedLevel).toBe(1);
    expect(state.levelsProgress).toEqual({});
    expect(state.userXp).toBe(0);
  });

  it("does NOT unlock level 2 if user scores only 1 star (less than 2 of 3)", () => {
    const store = useGameStore.getState();
    store.completeLevel(1, 1, 75, "general");

    const state = useGameStore.getState();
    // Nivel 2 debe permanecer bloqueado
    expect(state.highestUnlockedLevel).toBe(1);
    expect(state.levelsProgress[1]?.status).toBe("unlocked");
    expect(state.levelsProgress[1]?.stars).toBe(1);
  });

  it("unlocks level 2 and marks completed when scoring 2 stars (2 of 3)", () => {
    const store = useGameStore.getState();
    store.completeLevel(1, 2, 100, "general");

    const state = useGameStore.getState();
    expect(state.highestUnlockedLevel).toBe(2);
    expect(state.levelsProgress[1]?.status).toBe("completed");
    expect(state.levelsProgress[1]?.stars).toBe(2);
  });

  it("unlocks level 2 and records 3 stars when completing level 1 with perfect score", () => {
    const store = useGameStore.getState();
    store.completeLevel(1, 3, 125, "que-hace-tu-autoridad");

    const updated = useGameStore.getState();
    expect(updated.highestUnlockedLevel).toBe(2);
    expect(updated.levelsProgress[1]).toEqual({
      stars: 3,
      status: "completed",
    });
    expect(updated.userXp).toBe(125);
  });

  it("does not clamp unlocking when rawQuestions has few questions (bug fix)", () => {
    const store = useGameStore.getState();
    store.setQuestions([mockQuestion(1), mockQuestion(2), mockQuestion(3)]);

    store.completeLevel(1, 3, 125, "que-hace-tu-autoridad");

    const updated = useGameStore.getState();
    expect(updated.highestUnlockedLevel).toBe(2);
    expect(updated.levelsProgress[1]?.status).toBe("completed");
  });

  it("does not downgrade highestUnlockedLevel or stars on replaying a level", () => {
    const store = useGameStore.getState();
    // Primer juego: 3 estrellas (aprobado)
    store.completeLevel(1, 3, 125, "general");
    expect(useGameStore.getState().highestUnlockedLevel).toBe(2);

    // Segundo juego: solo 1 estrella (fallo en reintento)
    store.completeLevel(1, 1, 75, "general");
    const replayed = useGameStore.getState();
    // El nivel 2 debe seguir desbloqueado y las 3 estrellas preservadas
    expect(replayed.highestUnlockedLevel).toBe(2);
    expect(replayed.levelsProgress[1]?.stars).toBe(3);
    expect(replayed.levelsProgress[1]?.status).toBe("completed");
  });

  it("progresses sequentially from level 1 to level 2 to level 3 with >= 2 stars", () => {
    const store = useGameStore.getState();
    store.completeLevel(1, 2, 100, "map_campaign");
    expect(useGameStore.getState().highestUnlockedLevel).toBe(2);

    store.completeLevel(2, 2, 100, "map_campaign");
    expect(useGameStore.getState().highestUnlockedLevel).toBe(3);
    expect(useGameStore.getState().levelsProgress[2]).toEqual({
      stars: 2,
      status: "completed",
    });
  });

  it("getLevels() reflects completed status and unlocked level 2", () => {
    const store = useGameStore.getState();
    store.setQuestions([
      mockQuestion(1),
      mockQuestion(2),
      mockQuestion(3),
      mockQuestion(4),
      mockQuestion(5),
      mockQuestion(6),
    ]);

    store.completeLevel(1, 3, 125, "general");

    const levels = useGameStore.getState().getLevels("general");
    expect(levels.length).toBe(2);

    // Level 1: completed with 3 stars
    expect(levels[0].id).toBe(1);
    expect(levels[0].status).toBe("completed");
    expect(levels[0].stars).toBe(3);

    // Level 2: unlocked
    expect(levels[1].id).toBe(2);
    expect(levels[1].status).toBe("unlocked");
    expect(levels[1].stars).toBe(0);
  });

  it("syncs progress with map_campaign so topic switching preserves map campaign progress", () => {
    const store = useGameStore.getState();
    store.completeLevel(1, 3, 125, "region-junin");

    store.setCurrentTopic({
      id: "topic-2",
      slug: "que-hace-tu-autoridad",
      title: "¿Qué hace tu autoridad?",
      description: "",
      is_active: true,
      order_index: 1,
    });

    const state = useGameStore.getState();
    expect(state.highestUnlockedLevel).toBe(2);
    expect(state.levelsProgress[1]?.stars).toBe(3);
  });
});

describe("Stratified Level Hydrator (Slot Architecture & Index Gaps Invariants)", () => {
  const topics: TriviaTopic[] = [
    {
      id: "top_1",
      slug: "que-hace-tu-autoridad",
      title: "¿Qué hace tu autoridad?",
      order_index: 1,
      is_active: true,
    },
    {
      id: "top_3",
      slug: "reglas-votacion-2026",
      title: "Reglas de Votación",
      order_index: 3,
      is_active: true,
    },
    {
      id: "top_5",
      slug: "lo-dijo-en-camara",
      title: "Lo Dijo en Cámara (Debates)",
      order_index: 5,
      is_active: true,
      is_regional: true,
    },
  ];

  it("interleaves Slot 1 (Eje 1), Slot 2 (Eje 3), Slot 3 (Debate territorial) correctly", () => {
    const questions: TriviaQuestion[] = [
      // Eje 1 (con gaps en global_index: 1, 2, y luego 21)
      mockQuestion(101, "top_1", 1),
      mockQuestion(102, "top_1", 2),
      mockQuestion(103, "top_1", 21), // salto de índice
      // Eje 3
      mockQuestion(201, "top_3", 14),
      mockQuestion(202, "top_3", 15),
      mockQuestion(203, "top_3", 16),
      // Eje 5 (Debate Junín: dist_junin)
      mockQuestion(301, "top_5", 29, "dist_junin"),
      mockQuestion(302, "top_5", 30, "dist_junin"),
      mockQuestion(303, "top_5", 31, "dist_junin"),
    ];

    const result = buildStratifiedMapQuestions(questions, topics, "dist_junin");

    // Nivel 1 (primeras 3 preguntas)
    expect(result[0].id).toBe(101); // Slot 1: Eje 1 (index relativo 0 -> global_index 1)
    expect(result[1].id).toBe(201); // Slot 2: Eje 3 (index relativo 0 -> global_index 14)
    expect(result[2].id).toBe(301); // Slot 3: Debate Junín (index relativo 0 -> global_index 29)

    // Nivel 2 (segundas 3 preguntas)
    expect(result[3].id).toBe(102); // Slot 1: Eje 1 (index relativo 1 -> global_index 2)
    expect(result[4].id).toBe(202); // Slot 2: Eje 3 (index relativo 1 -> global_index 15)
    expect(result[5].id).toBe(302); // Slot 3: Debate Junín (index relativo 1 -> global_index 30)

    // Nivel 3 (terceras 3 preguntas: verifica tolerancia a salto de 2 a 21)
    expect(result[6].id).toBe(103); // Slot 1: Eje 1 con index 21 tomado por posición relativa sin error!
    expect(result[7].id).toBe(203); // Slot 2: Eje 3
    expect(result[8].id).toBe(303); // Slot 3: Debate Junín
  });

  it("prioritizes selected region debate questions and excludes debates of other regions", () => {
    const questions: TriviaQuestion[] = [
      mockQuestion(101, "top_1", 1),
      mockQuestion(201, "top_3", 10),
      mockQuestion(301, "top_5", 25, "dist_arequipa"), // Debate Arequipa
      mockQuestion(302, "top_5", 26, "dist_junin"), // Debate Junín
    ];

    const result = buildStratifiedMapQuestions(questions, topics, "dist_junin");

    // Nivel 1 debe tomar el debate de Junín en el Slot 3
    expect(result[0].id).toBe(101); // Eje 1
    expect(result[1].id).toBe(201); // Eje 3
    expect(result[2].id).toBe(302); // Debate Junín
    expect(result.some((q) => q.id === 301)).toBe(false); // Arequipa excluida al jugar Junín
  });

  it("limits total map questions strictly to general pools plus selected region debates", () => {
    const questions: TriviaQuestion[] = [
      ...Array.from({ length: 14 }, (_, i) =>
        mockQuestion(100 + i, "top_1", i + 1),
      ),
      ...Array.from({ length: 14 }, (_, i) =>
        mockQuestion(200 + i, "top_3", i + 15),
      ),
      ...Array.from({ length: 12 }, (_, i) =>
        mockQuestion(300 + i, "top_5", i + 30, "dist_piura"),
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        mockQuestion(400 + i, "top_5", i + 50, "dist_arequipa"),
      ),
      ...Array.from({ length: 15 }, (_, i) =>
        mockQuestion(500 + i, "top_5", i + 70, "dist_lima"),
      ),
    ];

    const result = buildStratifiedMapQuestions(questions, topics, "dist_piura");

    // 14 (Eje 1) + 14 (Eje 3) + 12 (Piura) = 40 preguntas (= 14 niveles), NUNCA 65 preguntas
    expect(result.length).toBe(40);
    expect(
      result.some((q) => q.electoral_district_id === "dist_arequipa"),
    ).toBe(false);
    expect(result.some((q) => q.electoral_district_id === "dist_lima")).toBe(
      false,
    );
  });

  it("distributes questions fairly across 4 active general topics via dynamic round-robin", () => {
    const multiTopics: TriviaTopic[] = [
      {
        id: "top_1",
        slug: "eje-1",
        title: "Eje 1",
        order_index: 1,
        is_active: true,
      },
      {
        id: "top_2",
        slug: "eje-2",
        title: "Eje 2",
        order_index: 2,
        is_active: true,
      },
      {
        id: "top_3",
        slug: "eje-3",
        title: "Eje 3",
        order_index: 3,
        is_active: true,
      },
      {
        id: "top_4",
        slug: "eje-4",
        title: "Eje 4",
        order_index: 4,
        is_active: true,
      },
      {
        id: "top_5",
        slug: "debate",
        title: "Debate",
        order_index: 5,
        is_active: true,
        is_regional: true,
      },
    ];

    const questions: TriviaQuestion[] = [
      mockQuestion(101, "top_1", 1),
      mockQuestion(102, "top_1", 2),
      mockQuestion(201, "top_2", 10),
      mockQuestion(202, "top_2", 11),
      mockQuestion(301, "top_3", 20),
      mockQuestion(302, "top_3", 21),
      mockQuestion(401, "top_4", 30),
      mockQuestion(402, "top_4", 31),
      mockQuestion(501, "top_5", 40),
      mockQuestion(502, "top_5", 41),
    ];

    const result = buildStratifiedMapQuestions(questions, multiTopics);

    // Nivel 1: Slot 1 (Eje 1), Slot 2 (Eje 2), Slot 3 (Debate 501)
    expect(result[0].id).toBe(101);
    expect(result[1].id).toBe(201);
    expect(result[2].id).toBe(501);

    // Nivel 2: Slot 1 (Eje 3), Slot 2 (Eje 4), Slot 3 (Debate 502)
    expect(result[3].id).toBe(301);
    expect(result[4].id).toBe(401);
    expect(result[5].id).toBe(502);

    // Nivel 3: Slot 1 (Eje 1), Slot 2 (Eje 2), Slot 3 (Fallback o remanente)
    expect(result[6].id).toBe(102);
    expect(result[7].id).toBe(202);
  });
});
