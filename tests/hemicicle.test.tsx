import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import HemicileLegislator, {
  processSeatsForHemiciclo,
} from "@/components/landing/hemicicle";
import {
  SeatParliamentary,
  ChamberType,
  LegislatorCondition,
} from "@/interfaces/politics";

// Mock next/image to avoid unconfigured host errors
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    fill: _fill,
    ...props
  }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} {...props} />;
  },
}));

// ============================================================
// MOCK DATA HELPERS
// ============================================================

function makeSeat(
  id: string,
  overrides: Partial<SeatParliamentary> = {},
): SeatParliamentary {
  return {
    id,
    chamber: ChamberType.DIPUTADOS,
    number_seat: 1,
    row: 1,
    legislator: null,
    ...overrides,
  };
}

function makeGroup(
  id: string,
  name: string,
  overrides: {
    color_hex?: string | null;
    logo_url?: string | null;
    government_audio_url?: string | null;
  } = {},
) {
  return {
    id,
    name,
    acronym: name.slice(0, 3).toUpperCase(),
    color_hex: overrides.color_hex ?? null,
    logo_url: overrides.logo_url ?? null,
    government_audio_url: overrides.government_audio_url ?? null,
  };
}

// ============================================================
// UNIT TESTS: processSeatsForHemiciclo
// ============================================================

describe("processSeatsForHemiciclo", () => {
  it("returns an empty array when given empty seats", () => {
    const result = processSeatsForHemiciclo([]);
    expect(result).toEqual([]);
  });

  it("groups seats by parliamentary group", () => {
    const groupA = makeGroup("gA", "Partido A");
    const groupB = makeGroup("gB", "Partido B");

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: groupA }),
      makeSeat("s2", { parliamentarygroup: groupA }),
      makeSeat("s3", { parliamentarygroup: groupA }),
      makeSeat("s4", { parliamentarygroup: groupB }),
      makeSeat("s5", { parliamentarygroup: groupB }),
    ];

    const result = processSeatsForHemiciclo(seats);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Partido A");
    expect(result[0].seats).toBe(3);
    expect(result[1].name).toBe("Partido B");
    expect(result[1].seats).toBe(2);
  });

  it("sorts groups by seat count descending", () => {
    const groupA = makeGroup("gA", "Chico", { color_hex: "#aaa" });
    const groupB = makeGroup("gB", "Grande", { color_hex: "#bbb" });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: groupA }),
      makeSeat("s2", { parliamentarygroup: groupB }),
      makeSeat("s3", { parliamentarygroup: groupB }),
      makeSeat("s4", { parliamentarygroup: groupB }),
    ];

    const result = processSeatsForHemiciclo(seats);
    expect(result[0].name).toBe("Grande");
    expect(result[0].seats).toBe(3);
    expect(result[1].name).toBe("Chico");
    expect(result[1].seats).toBe(1);
  });

  it("propagates government_audio_url from group", () => {
    const group = makeGroup("gA", "Con Audio", {
      government_audio_url: "https://example.com/audio.mp3",
    });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
    ];

    const result = processSeatsForHemiciclo(seats);
    expect(result[0].government_audio_url).toBe(
      "https://example.com/audio.mp3",
    );
  });

  it("sets government_audio_url to null when not present", () => {
    const group = makeGroup("gA", "Sin Audio");

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
    ];

    const result = processSeatsForHemiciclo(seats);
    expect(result[0].government_audio_url).toBeNull();
  });

  it("falls back to legislator's current_parliamentary_group", () => {
    const group = makeGroup("gA", "Via Legislator", {
      government_audio_url: "https://example.com/legislator-audio.mp3",
    });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", {
        parliamentarygroup: null,
        legislator: {
          id: "leg1",
          person_id: "p1",
          chamber: ChamberType.DIPUTADOS,
          condition: LegislatorCondition.EN_EJERCICIO,
          active: true,
          elected_by_party: {
            id: "pA",
            name: "Partido A",
            acronym: "PA",
            logo_url: null,
            color_hex: null,
            active: true,
            foundation_date: null,
          },
          current_parliamentary_group: group,
          person: {
            name: "Juan",
            lastname: "Pérez",
            image_url: null,
            image_candidate_url: null,
          },
        },
      }),
    ];

    const result = processSeatsForHemiciclo(seats);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Via Legislator");
    expect(result[0].government_audio_url).toBe(
      "https://example.com/legislator-audio.mp3",
    );
  });

  it("applies default color when color_hex is missing", () => {
    const group = makeGroup("gA", "Sin Color");

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
    ];

    const result = processSeatsForHemiciclo(seats);
    expect(result[0].color).toBe("#94a3b8");
  });

  it("uses provided logo_url and color_hex", () => {
    const group = makeGroup("gA", "Con Logo", {
      color_hex: "#ff0000",
      logo_url: "https://example.com/logo.png",
    });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
    ];

    const result = processSeatsForHemiciclo(seats);
    expect(result[0].color).toBe("#ff0000");
    expect(result[0].logo_url).toBe("https://example.com/logo.png");
  });
});

// ============================================================
// COMPONENT TESTS: HemicileLegislator audio toggle
// ============================================================

const audioFile = "data:audio/mp3;base64,SUQzBAAAAA==";

describe("HemicileLegislator — audio playback", () => {
  let playStub: ReturnType<typeof vi.fn>;
  let pauseStub: ReturnType<typeof vi.fn>;
  let loadStub: ReturnType<typeof vi.fn>;
  let isAudioPlaying: boolean;
  let capturedSrc: string;

  beforeEach(() => {
    capturedSrc = "";
    isAudioPlaying = false;

    playStub = vi.fn().mockResolvedValue(undefined);
    pauseStub = vi.fn();
    loadStub = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play") as any;
    playSpy.mockImplementation(function (this: HTMLMediaElement) {
      playStub();
      capturedSrc = this.src;
      isAudioPlaying = true;
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause") as any;
    pauseSpy.mockImplementation(function (this: HTMLMediaElement) {
      pauseStub();
      isAudioPlaying = false;
      this.dispatchEvent(new Event("pause"));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadSpy = vi.spyOn(HTMLAudioElement.prototype, "load") as any;
    loadSpy.mockImplementation(function (this: HTMLAudioElement) {
      loadStub();
    });

    // Mock paused property to reflect actual state
    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      get() {
        return !isAudioPlaying;
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function renderWithSeats(seats: SeatParliamentary[]) {
    const user = userEvent.setup();
    const result = render(<HemicileLegislator seatsData={seats} />);
    await act(() => new Promise((r) => setTimeout(r, 0)));
    return { user, ...result };
  }

  async function clickGroupCard(name: string) {
    // Use fireEvent for synchronous click to test the handler directly
    const card = screen.getByText(name).closest("[class*='rounded-xl']")!;
    fireEvent.click(card);
    // Flush microtasks and React
    await act(() => new Promise((r) => setTimeout(r, 0)));
  }

  it("shows cursor-pointer on groups with audio", async () => {
    const group = makeGroup("gA", "Partido A", {
      government_audio_url: audioFile,
      logo_url: "https://example.com/logo.png",
    });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
      makeSeat("s2", { parliamentarygroup: group }),
    ];

    await renderWithSeats(seats);

    const card = screen
      .getByText("Partido A")
      .closest("[class*='rounded-xl']")!;
    expect(card.classList.toString()).toContain("cursor-pointer");
  });

  it("does not show cursor-pointer on groups without audio", async () => {
    const group = makeGroup("gA", "Sin Audio");

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
    ];

    await renderWithSeats(seats);

    const card = screen
      .getByText("Sin Audio")
      .closest("[class*='rounded-xl']")!;
    expect(card.classList.toString()).not.toContain("cursor-pointer");
  });

  it("plays audio when clicking a group card with audio", async () => {
    const group = makeGroup("gA", "Partido A", {
      government_audio_url: audioFile,
    });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
    ];

    await renderWithSeats(seats);
    await clickGroupCard("Partido A");

    expect(capturedSrc).toBe(audioFile);
    expect(loadStub).toHaveBeenCalled();
    expect(playStub).toHaveBeenCalled();
  });

  it("pauses audio when clicking the same group that is playing", async () => {
    const group = makeGroup("gA", "Partido A", {
      government_audio_url: audioFile,
    });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: group }),
    ];

    await renderWithSeats(seats);

    // First click: play
    await clickGroupCard("Partido A");
    expect(playStub).toHaveBeenCalledTimes(1);

    // Second click: pause (same group, audio is already playing)
    await clickGroupCard("Partido A");
    expect(pauseStub).toHaveBeenCalledTimes(1);
  });

  it("switches to new group audio when clicking a different group", async () => {
    const groupA = makeGroup("gA", "Partido A", {
      government_audio_url: audioFile,
    });
    const groupB = makeGroup("gB", "Partido B", {
      government_audio_url: "data:audio/mp3;base64,different",
    });

    const seats: SeatParliamentary[] = [
      makeSeat("s1", { parliamentarygroup: groupA }),
      makeSeat("s2", { parliamentarygroup: groupB }),
    ];

    await renderWithSeats(seats);

    // Click A: plays
    await clickGroupCard("Partido A");
    expect(capturedSrc).toBe(audioFile);

    // Click B: switches to B
    await clickGroupCard("Partido B");
    expect(capturedSrc).toBe("data:audio/mp3;base64,different");
    expect(loadStub).toHaveBeenCalledTimes(2);
  });
});
