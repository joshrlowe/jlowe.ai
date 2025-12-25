import { useState } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import styles from "@/styles/ProjectFilters.module.css";

export default function ProjectFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  availableTags = [],
  availableStatuses = [],
  onClearFilters,
}) {
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.searchRow}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
            aria-label="Search projects"
          />
        </InputGroup>
      </div>

      <div className={styles.filterRow}>
        <Form.Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replace(/([A-Z])/g, " $1").trim()}
            </option>
          ))}
        </Form.Select>

        <Form.Select
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
          className={styles.filterSelect}
          aria-label="Filter by tag"
        >
          <option value="all">All Tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </Form.Select>

        {(searchQuery || statusFilter !== "all" || tagFilter !== "all") && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onClearFilters}
            className={styles.clearButton}
            aria-label="Clear all filters"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

