/**
 * Tests for CertificationCard component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CertificationCard from "@/components/About/CertificationCard/CertificationCard";

describe("CertificationCard", () => {
  it("returns null when certification is not provided", () => {
    const { container } = render(<CertificationCard />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when certification is null", () => {
    const { container } = render(<CertificationCard certification={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders certification name", () => {
    const cert = { name: "AWS Solutions Architect" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
  });

  it("renders certification title when name is not available", () => {
    const cert = { title: "Certified Developer" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("Certified Developer")).toBeInTheDocument();
  });

  it("renders issuer", () => {
    const cert = { name: "Cert", issuer: "Amazon Web Services" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("Amazon Web Services")).toBeInTheDocument();
  });

  it("renders organization when issuer is not available", () => {
    const cert = { name: "Cert", organization: "Google Cloud" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("Google Cloud")).toBeInTheDocument();
  });

  it("renders dateObtained", () => {
    const cert = { name: "Cert", dateObtained: "Jan 2024" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("Jan 2024")).toBeInTheDocument();
  });

  it("renders date when dateObtained is not available", () => {
    const cert = { name: "Cert", date: "Feb 2024" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("Feb 2024")).toBeInTheDocument();
  });

  it("renders expiration date when provided", () => {
    const cert = { name: "Cert", dateObtained: "Jan 2024", expirationDate: "Jan 2027" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("Jan 2024 - Jan 2027")).toBeInTheDocument();
  });

  it("renders credential ID when provided", () => {
    const cert = { name: "Cert", credentialId: "ABC123" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("ID: ABC123")).toBeInTheDocument();
  });

  it("does not render credential ID when not provided", () => {
    const cert = { name: "Cert" };
    render(<CertificationCard certification={cert} />);
    expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
  });

  it("renders credential link when URL is provided", () => {
    const cert = { name: "Cert", url: "https://example.com/cert" };
    render(<CertificationCard certification={cert} />);
    const link = screen.getByText("View Credential →");
    expect(link).toHaveAttribute("href", "https://example.com/cert");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render credential link when URL is not provided", () => {
    const cert = { name: "Cert" };
    render(<CertificationCard certification={cert} />);
    expect(screen.queryByText("View Credential →")).not.toBeInTheDocument();
  });

  it("displays first letter of name as icon", () => {
    const cert = { name: "AWS Certification" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("displays first letter of title when name is not available", () => {
    const cert = { title: "Google Certification" };
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("displays C as fallback icon", () => {
    const cert = {};
    render(<CertificationCard certification={cert} />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });
});

