export default function Hobbies({ hobbies = [] }) {
  if (!hobbies || hobbies.length === 0) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Hobbies & Interests
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {hobbies.map((hobby, index) => {
          const hobbyName = typeof hobby === "string" ? hobby : hobby.name || hobby.title;
          const hobbyColor = typeof hobby === "string" ? null : hobby.color;
          
          return (
            <div
              key={index}
              className="p-4 rounded-lg text-center transition-colors duration-300"
              style={{
                background: hobbyColor 
                  ? `${hobbyColor}15` 
                  : "var(--color-bg-darker)",
                border: hobbyColor 
                  ? `1px solid ${hobbyColor}30` 
                  : "1px solid transparent",
              }}
            >
              {hobby.icon && <div className="text-3xl mb-2">{hobby.icon}</div>}
              <div 
                className="font-medium"
                style={{ color: hobbyColor || "var(--color-text-primary)" }}
              >
                {hobbyName}
              </div>
              {hobby.description && (
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {hobby.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
