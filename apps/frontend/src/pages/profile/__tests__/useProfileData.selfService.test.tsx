// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiPost: vi.fn(),
  clientGet: vi.fn(),
  clientPut: vi.fn(),
  refreshUser: vi.fn(),
  user: { role: "MERCHANT", firstName: "Mona", lastName: "Adel", email: "mona@test.com", phone: "01000000001" } as Record<string, unknown>,
}));

vi.mock("../../../services/api", () => ({
  default: {
    get: (...args: unknown[]) => mocks.apiGet(...args),
    put: (...args: unknown[]) => mocks.apiPut(...args),
    post: (...args: unknown[]) => mocks.apiPost(...args),
  },
}));

vi.mock("../../../services/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mocks.clientGet(...args),
    put: (...args: unknown[]) => mocks.clientPut(...args),
  },
}));

vi.mock("../../../hooks/useAuthSimple", () => ({
  useAuth: () => ({ user: mocks.user, refreshUser: mocks.refreshUser }),
}));

vi.mock("../../../utils/postAuthRouting", () => ({
  saveDefaultPagePreference: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { useProfileData } from "../components/useProfileData";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/profile"]}>{children}</MemoryRouter>
);

const wrapperWithTab = (tab: string) => ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={[`/profile?tab=${tab}`]}>{children}</MemoryRouter>
);

describe("useProfileData self-service account save", () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPut.mockReset();
    mocks.apiPost.mockReset();
    mocks.clientGet.mockReset();
    mocks.clientPut.mockReset();
    mocks.refreshUser.mockReset();
    mocks.user = {
      role: "MERCHANT",
      firstName: "Mona",
      lastName: "Adel",
      email: "mona@test.com",
      phone: "01000000001",
    };
    mocks.apiPut.mockResolvedValue({ data: { success: true } });
    mocks.apiPost.mockResolvedValue({ data: { success: true, image: { url: "https://cdn.test/a.png" } } });
    mocks.clientGet.mockResolvedValue({ data: { success: false } });
    mocks.refreshUser.mockResolvedValue(null);
  });

  it("saves merchant accounts through PUT /auth/me instead of the HR endpoint", async () => {
    const { result } = renderHook(() => useProfileData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mocks.apiPut).toHaveBeenCalledWith(
      "/auth/me",
      expect.objectContaining({
        firstName: "Mona",
        lastName: "Adel",
        phone: "01000000001",
      })
    );
    expect(mocks.apiPut).not.toHaveBeenCalledWith("/hr/employees/me", expect.anything());
    expect(mocks.refreshUser).toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  it("keeps the HR endpoint for employee accounts", async () => {
    mocks.user = {
      role: "EMPLOYEE",
      firstName: "Omar",
      lastName: "Khaled",
      email: "omar@test.com",
      phone: "01000000002",
    };
    mocks.apiGet.mockResolvedValue({
      data: { employee: { id: "emp-1", firstName: "Omar", lastName: "Khaled", email: "omar@test.com" } },
    });

    const { result } = renderHook(() => useProfileData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mocks.apiPut).toHaveBeenCalledWith("/hr/employees/me", expect.objectContaining({ firstName: "Omar" }));
    expect(mocks.apiPut).not.toHaveBeenCalledWith("/auth/me", expect.anything());
  });

  it("restores the previous values when the edit is cancelled", async () => {
    const { result } = renderHook(() => useProfileData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setIsEditing(true);
    });
    act(() => {
      result.current.setFormData((prev) => ({ ...prev, firstName: "Typo" }));
    });
    expect(result.current.formData.firstName).toBe("Typo");

    act(() => {
      result.current.setIsEditing(false);
    });
    expect(result.current.formData.firstName).toBe("Mona");
    expect(result.current.isEditing).toBe(false);
  });

  it("maps legacy tab ids onto the merged tabs", async () => {
    const { result } = renderHook(() => useProfileData(), { wrapper: wrapperWithTab("job") });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTab).toBe("work");

    act(() => {
      result.current.setActiveTab("api-keys");
    });
    expect(result.current.activeTab).toBe("security");
  });

  it("keeps the four merged tabs untouched", async () => {
    const { result } = renderHook(() => useProfileData(), { wrapper: wrapperWithTab("personal") });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTab).toBe("personal");
  });

  it("persists an uploaded avatar on the user account when there is no employee record", async () => {    const { result } = renderHook(() => useProfileData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(event);
    });

    expect(mocks.apiPost).toHaveBeenCalledWith(
      "/user/image-gallery/upload",
      expect.any(FormData),
      expect.anything(),
    );
    expect(mocks.apiPut).toHaveBeenCalledWith("/auth/me", { avatar: "https://cdn.test/a.png" });
    expect(mocks.refreshUser).toHaveBeenCalled();
  });
});
