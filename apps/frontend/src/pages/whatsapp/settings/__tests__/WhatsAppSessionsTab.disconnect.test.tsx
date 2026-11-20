// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WhatsAppSessionsTab } from "../components/WhatsAppSessionsTab";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { dir: () => "rtl", language: "ar" },
  }),
}));

const connectedSession = {
  id: "sess_connected",
  name: "Sales number",
  phoneNumber: "201001234567",
  status: "CONNECTED",
  liveStatus: "connected",
  qrCode: null,
  autoReply: false,
  welcomeMessage: null,
  awayMessage: null,
  workingHoursEnabled: false,
  workingHours: null,
  isDefault: true,
  createdAt: "2026-01-01T00:00:00Z",
  provider: "BAILEYS",
  _count: { messages: 41, contacts: 24 },
} as never;

/**
 * Disconnecting a number stops incoming messages immediately, so it must not
 * happen on a single click — it goes through a confirm dialog first.
 */
describe("WhatsAppSessionsTab: disconnect guard", () => {
  it("asks for confirmation before disconnecting", () => {
    const onDisconnectSession = vi.fn();

    render(
      <WhatsAppSessionsTab
        sessions={[connectedSession]}
        settings={null}
        connectingSessionId={null}
        onRefresh={vi.fn()}
        onOpenCreateSession={vi.fn()}
        onOpenWebhookDetails={vi.fn()}
        onConnectSession={vi.fn()}
        onDisconnectSession={onDisconnectSession}
        onStartEditSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "whatsappSettings.disconnect" }),
    );

    expect(onDisconnectSession).not.toHaveBeenCalled();
    expect(
      screen.getByText("whatsappSettings.dialogs.disconnectConfirmTitle"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "whatsappSettings.dialogs.disconnectConfirmAction",
      }),
    );

    expect(onDisconnectSession).toHaveBeenCalledWith("sess_connected");
  });
});
