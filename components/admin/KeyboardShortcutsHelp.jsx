import { Modal, Table } from "react-bootstrap";

export default function KeyboardShortcutsHelp({ show, onHide }) {
  const shortcuts = [
    { key: "Ctrl/Cmd + K", description: "Quick search" },
    { key: "Ctrl/Cmd + N", description: "New project" },
    { key: "Ctrl/Cmd + S", description: "Save (in modals)" },
    { key: "Esc", description: "Close modals" },
    { key: "Ctrl/Cmd + /", description: "Show shortcuts help" },
    { key: "Ctrl/Cmd + A", description: "Select all projects" },
    { key: "Ctrl/Cmd + D", description: "Deselect all projects" },
  ];

  return (
    <Modal show={show} onHide={onHide} size="sm" centered>
      <Modal.Header closeButton>
        <Modal.Title>Keyboard Shortcuts</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((shortcut, i) => (
              <tr key={i}>
                <td>
                  <code>{shortcut.key}</code>
                </td>
                <td>{shortcut.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
}

