import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { UserPlus, Edit2, Trash2, X } from "lucide-react";
import { Table, Modal, Button, Input, Label, Select, ListBox } from "@heroui/react";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/_app/usuarios")({
  component: UsuariosView,
});

function UsuariosView() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "medico" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.rol !== "admin") {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  if (!user || user.rol !== "admin") {
    return null;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authClient.admin.listUsers({ query: { limit: 50 } });
      if (res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await authClient.signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      } as any);

      if (res.error) {
        setError(res.error.message || "Error al crear usuario");
        return;
      }
      
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "medico" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Error al crear usuario");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await authClient.admin.removeUser({ userId });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar usuario");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl tracking-tight font-medium mb-2">
            Gestión de <span className="text-green">Usuarios</span>
          </h1>
          <p className="text-smoke text-base">
            Administra el acceso y roles del personal médico del sistema.
          </p>
        </div>
        <Button
          variant="primary"
          onPress={() => setIsModalOpen(true)}
          className="rounded-full font-medium flex items-center gap-2 cursor-pointer"
        >
          <UserPlus size={16} />
          Crear Usuario
        </Button>
      </div>

      <div className="border border-charcoal rounded-2xl overflow-hidden">
        <Table aria-label="Tabla de usuarios">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>Nombre</Table.Column>
                <Table.Column>Email</Table.Column>
                <Table.Column>Rol</Table.Column>
                <Table.Column className="text-right">Acciones</Table.Column>
              </Table.Header>
              <Table.Body>
                {loading ? (
                  <Table.Row>
                    <Table.Cell className="text-center text-smoke py-8" colSpan={4}>
                      Cargando usuarios...
                    </Table.Cell>
                  </Table.Row>
                ) : users.length === 0 ? (
                  <Table.Row>
                    <Table.Cell className="text-center text-smoke py-8" colSpan={4}>
                      No hay usuarios registrados.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  users.map((user) => (
                    <Table.Row key={user.id}>
                      <Table.Cell>{user.name || user.nombre || "-"}</Table.Cell>
                      <Table.Cell>{user.email}</Table.Cell>
                      <Table.Cell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-obsidian border border-slate text-snow">
                          {user.role || "Usuario"}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            isIconOnly
                            variant="ghost"
                            className="rounded-full cursor-pointer"
                            aria-label="Editar"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            onPress={() => handleDeleteUser(user.id)}
                            isIconOnly
                            variant="danger"
                            className="rounded-full cursor-pointer"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {/* Modal Crear Usuario */}
      <Modal.Backdrop isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>Nuevo Usuario</Modal.Heading>
              <Modal.CloseTrigger className="cursor-pointer" />
            </Modal.Header>
            
            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="bg-danger/20 border border-danger text-danger text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col gap-1.5">
                <Label>Nombre Completo</Label>
                <Input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej. Dra. María López"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="maria.lopez@clinica.com"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Contraseña</Label>
                <Input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Rol</Label>
                <Select
                  selectedKey={formData.role}
                  onSelectionChange={(key) => setFormData({...formData, role: String(key)})}
                  className="w-full"
                  placeholder="Seleccionar rol"
                >
                  <Select.Trigger className="w-full cursor-pointer">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="medico" textValue="Médico" className="cursor-pointer">
                        Médico
                      </ListBox.Item>
                      <ListBox.Item id="admin" textValue="Administrador" className="cursor-pointer">
                        Administrador
                      </ListBox.Item>
                      <ListBox.Item id="radiologo" textValue="Radiólogo" className="cursor-pointer">
                        Radiólogo
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-charcoal">
                <Button 
                  variant="ghost"
                  onPress={() => setIsModalOpen(false)}
                  className="rounded-full cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  variant="primary"
                  className="rounded-full cursor-pointer"
                >
                  Crear Usuario
                </Button>
              </div>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
