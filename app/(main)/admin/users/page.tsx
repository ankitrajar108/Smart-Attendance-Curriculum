"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Trash2,
  RefreshCw,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Plus,
  Pencil,
  QrCode,
  Download,
  Loader2,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  department?: string | null;
  interests?: string | null;
  careerGoals?: string | null;
  profileId?: string | null;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  TEACHER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  STUDENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const roleIcons: Record<string, React.ElementType> = {
  ADMIN: ShieldAlert,
  TEACHER: BookOpen,
  STUDENT: GraduationCap,
};

// ─── Create User Dialog ───────────────────────────────────────────────────────

interface CreateUserDialogProps {
  onCreated: () => void;
}

function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    department: "",
    interests: "",
    careerGoals: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
      department: "",
      interests: "",
      careerGoals: "",
    });
    setError("");
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/api/admin/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.role === "TEACHER" ? form.department : undefined,
        interests: form.role === "STUDENT" ? form.interests : undefined,
        careerGoals: form.role === "STUDENT" ? form.careerGoals : undefined,
      });
      toast({ title: "User created!" });
      handleOpenChange(false);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Create User
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. Fields marked * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                required
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                required
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => handleChange("role", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === "TEACHER" && (
              <div className="space-y-2">
                <Label htmlFor="create-dept">Department</Label>
                <Input
                  id="create-dept"
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
            )}

            {form.role === "STUDENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="create-interests">Interests</Label>
                  <Input
                    id="create-interests"
                    value={form.interests}
                    onChange={(e) => handleChange("interests", e.target.value)}
                    placeholder="e.g. Math, Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-goals">Career Goals</Label>
                  <Input
                    id="create-goals"
                    value={form.careerGoals}
                    onChange={(e) =>
                      handleChange("careerGoals", e.target.value)
                    }
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

interface EditUserDialogProps {
  user: AdminUser;
  onUpdated: () => void;
}

function EditUserDialog({ user, onUpdated }: EditUserDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    department: user.department || "",
    interests: user.interests || "",
    careerGoals: user.careerGoals || "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: user.name,
        email: user.email,
        department: user.department || "",
        interests: user.interests || "",
        careerGoals: user.careerGoals || "",
      });
      setError("");
    }
  }, [open, user]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.patch("/api/admin/users", {
        id: user.id,
        name: form.name,
        email: form.email,
        department: user.role === "TEACHER" ? form.department : undefined,
        interests: user.role === "STUDENT" ? form.interests : undefined,
        careerGoals: user.role === "STUDENT" ? form.careerGoals : undefined,
      });
      toast({ title: "User updated!" });
      setOpen(false);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="Edit user"
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update information for{" "}
              <span className="font-medium">{user.name}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            {user.role === "TEACHER" && (
              <div className="space-y-2">
                <Label htmlFor="edit-dept">Department</Label>
                <Input
                  id="edit-dept"
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
            )}

            {user.role === "STUDENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-interests">Interests</Label>
                  <Input
                    id="edit-interests"
                    value={form.interests}
                    onChange={(e) => handleChange("interests", e.target.value)}
                    placeholder="e.g. Math, Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-goals">Career Goals</Label>
                  <Input
                    id="edit-goals"
                    value={form.careerGoals}
                    onChange={(e) =>
                      handleChange("careerGoals", e.target.value)
                    }
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Student QR Code Dialog ───────────────────────────────────────────────────

interface StudentQRDialogProps {
  user: AdminUser;
}

function StudentQRDialog({ user }: StudentQRDialogProps) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGenerating(true);
    const text = `Student ID: ${user.id} | Name: ${user.name} | Email: ${user.email}`;
    QRCode.toDataURL(text, { width: 256 })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch(console.error)
      .finally(() => setGenerating(false));
  }, [open, user]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${user.name}-QR.png`;
    a.click();
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) setQrDataUrl("");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="View QR Code"
      >
        <QrCode className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Student QR Code</DialogTitle>
            <DialogDescription>
              {user.name} &mdash; {user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-2">
            {generating ? (
              <div className="w-64 h-64 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${user.name}`}
                className="w-64 h-64 border rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-muted rounded-lg" />
            )}
            <p className="text-xs text-muted-foreground text-center">
              Encodes student ID, name, and email
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!qrDataUrl || generating}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/users");
      setUsers(res.data);
    } catch {
      // silently ignore — table will just stay empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let result = users;
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [users, search, roleFilter]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiClient.delete("/api/admin/users", { data: { id } });
      toast({ title: "User deleted successfully" });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete user.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === "ADMIN").length,
    teacher: users.filter((u) => u.role === "TEACHER").length,
    student: users.filter((u) => u.role === "STUDENT").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage all users in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <CreateUserDialog onCreated={fetchUsers} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            count: counts.total,
            color: "text-foreground",
          },
          { label: "Admins", count: counts.admin, color: "text-red-600" },
          { label: "Teachers", count: counts.teacher, color: "text-blue-600" },
          { label: "Students", count: counts.student, color: "text-green-600" },
        ].map(({ label, count, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Role Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "ADMIN", "TEACHER", "STUDENT"].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role === "all" ? "All" : role}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No users found</p>
              <p className="text-sm">
                Try a different search term or role filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Extra Info</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => {
                    const RoleIcon = roleIcons[user.role] || Users;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[160px]">
                              {user.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground text-sm">
                          {user.email}
                        </TableCell>

                        <TableCell>
                          <Badge className={roleColors[user.role] || ""}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {user.role}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground max-w-[180px]">
                          {user.department && (
                            <span>Dept: {user.department}</span>
                          )}
                          {user.interests && (
                            <span className="block truncate">
                              Interests: {user.interests}
                            </span>
                          )}
                          {!user.department && !user.interests && (
                            <span className="italic">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit */}
                            <EditUserDialog
                              user={user}
                              onUpdated={fetchUsers}
                            />

                            {/* QR — students only */}
                            {user.role === "STUDENT" && (
                              <StudentQRDialog user={user} />
                            )}

                            {/* Delete — cannot delete yourself */}
                            {user.id !== currentUser?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={deleting === user.id}
                                    title="Delete user"
                                  >
                                    {deleting === user.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete User
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      <strong>{user.name}</strong>? This will
                                      remove their profile, enrollments, and
                                      attendance records. This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDelete(user.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
