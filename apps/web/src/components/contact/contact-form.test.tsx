import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "./contact-form";

const submitContact = vi.hoisted(() => vi.fn());

vi.mock("./submit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./submit")>()),
  submitContact,
}));

/** Fill the three real fields with values that pass client-side validation. */
async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(
    screen.getByLabelText("Message"),
    "I would like to talk about an analytical engine.",
  );
}

const send = () => screen.getByRole("button", { name: /send message/i });

beforeEach(() => {
  submitContact.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContactForm", () => {
  it("labels every visible control and wires the hints", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      /So I can reply/i,
    );
    expect(screen.getByLabelText("Message")).toHaveAccessibleDescription(
      /couple of sentences/i,
    );
  });

  it("fails closed on the client: invalid input never reaches the network", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(send());

    expect(submitContact).not.toHaveBeenCalled();
    expect(screen.getByText("Please enter your name.")).toBeInTheDocument();
  });

  it("describes the invalid field by its error and moves focus to it", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.type(
      screen.getByLabelText("Message"),
      "I would like to talk about an analytical engine.",
    );

    await user.click(send());

    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(/valid email address/i);
    // The first invalid field takes focus, so the problem is where the caret is.
    expect(email).toHaveFocus();
  });

  it("clears a field's error as soon as it is edited", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(send());
    expect(screen.getByText("Please enter your name.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "A");

    expect(
      screen.queryByText("Please enter your name."),
    ).not.toBeInTheDocument();
  });

  it("shows a pending state, then a focused success panel", async () => {
    const user = userEvent.setup();
    let resolve: (value: { ok: true }) => void = () => undefined;
    submitContact.mockReturnValue(
      new Promise<{ ok: true }>((r) => {
        resolve = r;
      }),
    );
    render(<ContactForm />);
    await fillValid(user);

    await user.click(send());

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    expect(screen.getByText("Sending your message…")).toBeInTheDocument();

    resolve({ ok: true });

    await waitFor(() => {
      expect(screen.getByText("Message sent")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Message sent").closest("[tabindex]"),
    ).toHaveFocus();
    // The form is gone, so nothing can be double-submitted.
    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  });

  it("surfaces the backend's error verbatim in an alert, with the mailto escape hatch", async () => {
    const user = userEvent.setup();
    submitContact.mockResolvedValue({
      ok: false,
      error: "Sorry — I could not send that just now.",
    });
    render(<ContactForm />);
    await fillValid(user);

    await user.click(send());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Sorry — I could not send that just now.");
    expect(
      screen.getByRole("link", { name: /joshlowe\.cs@gmail\.com/ }),
    ).toHaveAttribute("href", "mailto:joshlowe.cs@gmail.com");
    // The form stays put so the visitor can retry without retyping.
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
  });

  it("falls back to a generic message when the request throws", async () => {
    const user = userEvent.setup();
    submitContact.mockRejectedValue(new Error("network down"));
    render(<ContactForm />);
    await fillValid(user);

    await user.click(send());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Something went wrong sending that/i,
    );
  });

  it("keeps the honeypot away from keyboard and assistive tech", () => {
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="company"]',
    );
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    // Its wrapper is aria-hidden, so the input is outside the accessibility
    // tree entirely — a role query (which honours aria-hidden) cannot see it.
    expect(honeypot?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(
      screen.queryByRole("textbox", { name: "Company" }),
    ).not.toBeInTheDocument();
    // The three real fields are the only textboxes a user can reach.
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
  });

  it("sends the honeypot value along so the backend can silently drop bots", async () => {
    const user = userEvent.setup();
    submitContact.mockResolvedValue({ ok: true });
    const { container } = render(<ContactForm />);
    await fillValid(user);
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="company"]',
    );
    if (!honeypot) throw new Error("honeypot missing");
    // A bot fills every input it can find; a human can never reach this one.
    await user.type(honeypot, "Acme Spam Co");

    await user.click(send());

    await waitFor(() => expect(submitContact).toHaveBeenCalled());
    expect(submitContact.mock.calls[0]?.[0]).toMatchObject({
      company: "Acme Spam Co",
    });
  });
});
