import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InkInput } from "./InkInput";
it("calls onSubmit with trimmed value and clears", () => {
  const onSubmit = vi.fn();
  render(<InkInput onSubmit={onSubmit} disabled={false} />);
  const box = screen.getByRole("textbox") as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: "  hola  " } });
  fireEvent.keyDown(box, { key: "Enter" });
  expect(onSubmit).toHaveBeenCalledWith("hola");
  expect(box.value).toBe("");
});
it("does not submit on Shift+Enter and does not submit when disabled", () => {
  const onSubmit = vi.fn();
  const { rerender } = render(<InkInput onSubmit={onSubmit} disabled={false} />);
  const box = screen.getByRole("textbox") as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: "linea" } });
  fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
  expect(onSubmit).not.toHaveBeenCalled();
  rerender(<InkInput onSubmit={onSubmit} disabled={true} />);
  fireEvent.keyDown(box, { key: "Enter" });
  expect(onSubmit).not.toHaveBeenCalled();
});
