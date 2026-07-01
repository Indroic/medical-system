import { Button, Dropdown } from "@heroui/react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button isIconOnly variant="ghost" aria-label="Cambiar tema" className="text-muted">
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="top start">
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={theme ? [theme] : []}
          onAction={(key) => setTheme(String(key))}
        >
          <Dropdown.Item id="light" textValue="Claro">
            Claro
          </Dropdown.Item>
          <Dropdown.Item id="dark" textValue="Oscuro">
            Oscuro
          </Dropdown.Item>
          <Dropdown.Item id="system" textValue="Sistema">
            Sistema
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
