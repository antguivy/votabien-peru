"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDatePicker } from "@/components/date-picker";
import { toast } from "sonner";
import {
  Briefcase,
  DollarSign,
  GraduationCap,
  Home,
  Loader2,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  createPerson,
  fetchCandidateFromJNE,
  updatePerson,
} from "../_lib/actions";
import {
  AdminPerson,
  CreatePersonRequest,
  UpdatePersonRequest,
  WorkExperience,
  UniversityEducation,
  PoliticalRole,
  Incomes,
  Assets,
} from "@/interfaces/person";

// --- Schemas ---

const workExperienceSchema = z.object({
  position: z.string(),
  organization: z.string(),
  period: z.string(),
});

const technicalEducationSchema = z.object({
  graduate_school: z.string(),
  career: z.string(),
  concluded: z.string(),
});

const noUniversityEducationSchema = z.object({
  graduate_school: z.string(),
  career: z.string(),
  concluded: z.string(),
});

const universityEducationSchema = z.object({
  university: z.string(),
  degree: z.string(),
  concluded: z.string(),
  year_of_completion: z.string(),
});

const postgraduateEducationSchema = z.object({
  graduate_school: z.string(),
  specialization: z.string(),
  concluded: z.string(),
  degree: z.string(),
  year_of_completion: z.string(),
});

const politicalRoleSchema = z.object({
  political_organization: z.string(),
  position: z.string(),
  period: z.string(),
});

const popularElectionSchema = z.object({
  political_organization: z.string(),
  position: z.string(),
  period: z.string(),
});

const incomesSchema = z.object({
  public_income: z.string(),
  private_income: z.string(),
  total_income: z.string(),
});

const assetsSchema = z.object({
  type: z.string(),
  description: z.string(),
  value: z.string(),
});

const personSchema = z.object({
  id: z.string(),
  party_number_rop: z.string().nullable(),
  dni: z.string().min(8, "DNI debe tener al menos 8 caracteres"),
  gender: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastname: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  fullname: z.string(),
  image_url: z.string().nullable(),
  image_candidate_url: z
    .string()
    .min(15, "Requiere url de la imagen del candidato"),
  birth_date: z.string().nullable(),
  place_of_birth: z.string().nullable(),
  profession: z.string().nullable(),

  secondary_school: z.boolean(),
  technical_education: z.array(technicalEducationSchema),
  no_university_education: z.array(noUniversityEducationSchema),
  university_education: z.array(universityEducationSchema),
  postgraduate_education: z.array(postgraduateEducationSchema),
  work_experience: z.array(workExperienceSchema),
  political_role: z.array(politicalRoleSchema),
  popular_election: z.array(popularElectionSchema),
  incomes: z.array(incomesSchema),
  assets: z.array(assetsSchema),

  facebook_url: z.string().nullable(),
  twitter_url: z.string().nullable(),
  instagram_url: z.string().nullable(),
  tiktok_url: z.string().nullable(),
});

type PersonFormValues = z.infer<typeof personSchema>;

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: Partial<AdminPerson>;
}

// --- Componentes Auxiliares (Managers) ---

function WorkExperienceManager({
  value,
  onChange,
}: {
  value: WorkExperience[];
  onChange: (value: WorkExperience[]) => void;
}) {
  const [items, setItems] = useState<WorkExperience[]>(value || []);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { position: "", organization: "", period: "" },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof WorkExperience, val: string) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: val };
        return newItems;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">Experiencia {index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Input
              placeholder="Cargo"
              value={item.position}
              onChange={(e) => updateItem(index, "position", e.target.value)}
            />
            <Input
              placeholder="Organización"
              value={item.organization}
              onChange={(e) =>
                updateItem(index, "organization", e.target.value)
              }
            />
            <Input
              placeholder="Período (Ej: 2020-2023)"
              value={item.period}
              onChange={(e) => updateItem(index, "period", e.target.value)}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar experiencia laboral
      </Button>
    </div>
  );
}

function UniversityEducationManager({
  value,
  onChange,
}: {
  value: UniversityEducation[];
  onChange: (value: UniversityEducation[]) => void;
}) {
  const [items, setItems] = useState<UniversityEducation[]>(value || []);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { university: "", degree: "", concluded: "", year_of_completion: "" },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof UniversityEducation, val: string) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: val };
        return newItems;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              Educación Universitaria {index + 1}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Universidad"
              value={item.university}
              onChange={(e) => updateItem(index, "university", e.target.value)}
            />
            <Input
              placeholder="Grado"
              value={item.degree}
              onChange={(e) => updateItem(index, "degree", e.target.value)}
            />
            <Input
              placeholder="Concluido (Sí/No)"
              value={item.concluded}
              onChange={(e) => updateItem(index, "concluded", e.target.value)}
            />
            <Input
              placeholder="Año de conclusión"
              value={item.year_of_completion}
              onChange={(e) =>
                updateItem(index, "year_of_completion", e.target.value)
              }
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar educación universitaria
      </Button>
    </div>
  );
}

// Genérico tipado estrictamente (Record<string, string> asume que todos los campos son strings)
function EducationManager<T extends Record<string, string>>({
  value,
  onChange,
  title,
  fields,
}: {
  value: T[];
  onChange: (value: T[]) => void;
  title: string;
  fields: { key: keyof T; label: string; placeholder: string }[];
}) {
  const [items, setItems] = useState<T[]>(value || []);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    const newItem = fields.reduce((acc, field) => {
      acc[field.key] = "" as T[keyof T];
      return acc;
    }, {} as Partial<T>);

    setItems((prev) => [...prev, newItem as T]);
  }, [fields]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof T, val: string) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: val };
        return newItems;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {title} {index + 1}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field) => (
              <Input
                key={String(field.key)}
                placeholder={field.placeholder}
                value={item[field.key]}
                onChange={(e) => updateItem(index, field.key, e.target.value)}
              />
            ))}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar {title.toLowerCase()}
      </Button>
    </div>
  );
}

function PoliticalRoleManager({
  value,
  onChange,
  title,
}: {
  value: PoliticalRole[];
  onChange: (value: PoliticalRole[]) => void;
  title: string;
}) {
  const [items, setItems] = useState<PoliticalRole[]>(value || []);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { political_organization: "", position: "", period: "" },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof PoliticalRole, val: string) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: val };
        return newItems;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {title} {index + 1}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Input
              placeholder="Organización política"
              value={item.political_organization}
              onChange={(e) =>
                updateItem(index, "political_organization", e.target.value)
              }
            />
            <Input
              placeholder="Cargo"
              value={item.position}
              onChange={(e) => updateItem(index, "position", e.target.value)}
            />
            <Input
              placeholder="Período"
              value={item.period}
              onChange={(e) => updateItem(index, "period", e.target.value)}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar {title.toLowerCase()}
      </Button>
    </div>
  );
}

function IncomesManager({
  value,
  onChange,
}: {
  value: Incomes[];
  onChange: (value: Incomes[]) => void;
}) {
  const [items, setItems] = useState<Incomes[]>(value || []);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { public_income: "", private_income: "", total_income: "" },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof Incomes, val: string) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: val };
        return newItems;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              Registro de Ingresos {index + 1}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Ingreso público"
              value={item.public_income}
              onChange={(e) =>
                updateItem(index, "public_income", e.target.value)
              }
            />
            <Input
              placeholder="Ingreso privado"
              value={item.private_income}
              onChange={(e) =>
                updateItem(index, "private_income", e.target.value)
              }
            />
            <Input
              placeholder="Total"
              value={item.total_income}
              onChange={(e) =>
                updateItem(index, "total_income", e.target.value)
              }
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar registro de ingresos
      </Button>
    </div>
  );
}

function AssetsManager({
  value,
  onChange,
}: {
  value: Assets[];
  onChange: (value: Assets[]) => void;
}) {
  const [items, setItems] = useState<Assets[]>(value || []);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { type: "", description: "", value: "" }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof Assets, val: string) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: val };
        return newItems;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">Activo {index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Input
              placeholder="Tipo de activo"
              value={item.type}
              onChange={(e) => updateItem(index, "type", e.target.value)}
            />
            <Textarea
              placeholder="Descripción"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              rows={2}
            />
            <Input
              placeholder="Valor"
              value={item.value}
              onChange={(e) => updateItem(index, "value", e.target.value)}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar activo
      </Button>
    </div>
  );
}

// --- Componente Principal ---

export function PersonFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
}: PersonFormDialogProps) {
  const router = useRouter();
  const [loadingJNE, setLoadingJNE] = useState(false);
  const defaultValues = useMemo<PersonFormValues>(() => {
    if (mode === "edit" && initialData) {
      return {
        id: initialData.id || "",
        party_number_rop: initialData.party_number_rop || null,
        dni: initialData.dni || "",
        gender: initialData.gender || "",
        name: initialData.name || "",
        lastname: initialData.lastname || "",
        fullname: initialData.fullname || "",
        image_url: initialData.image_url || null,
        image_candidate_url: initialData.image_candidate_url,
        birth_date: initialData.birth_date || null,
        place_of_birth: initialData.place_of_birth || null,
        profession: initialData.profession || null,
        secondary_school: initialData.secondary_school || false,
        technical_education: initialData.technical_education || [],
        no_university_education: initialData.no_university_education || [],
        university_education: initialData.university_education || [],
        postgraduate_education: initialData.postgraduate_education || [],
        work_experience: initialData.work_experience || [],
        political_role: initialData.political_role || [],
        popular_election: initialData.popular_election || [],
        incomes: initialData.incomes || [],
        assets: initialData.assets || [],
        facebook_url: initialData.facebook_url || null,
        twitter_url: initialData.twitter_url || null,
        instagram_url: initialData.instagram_url || null,
        tiktok_url: initialData.tiktok_url || null,
      } as PersonFormValues;
    }

    return {
      id: "",
      party_number_rop: null,
      dni: "",
      gender: "",
      name: "",
      lastname: "",
      fullname: "",
      image_url: null,
      image_candidate_url: "",
      birth_date: null,
      place_of_birth: null,
      profession: null,
      secondary_school: false,
      technical_education: [],
      no_university_education: [],
      university_education: [],
      postgraduate_education: [],
      work_experience: [],
      political_role: [],
      popular_election: [],
      incomes: [],
      assets: [],
      facebook_url: null,
      twitter_url: null,
      instagram_url: null,
      tiktok_url: null,
    };
  }, [mode, initialData]);

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  // Auto-generar fullname cuando cambian nombre o apellido
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" || name === "lastname") {
        const fullname = `${value.name || ""} ${value.lastname || ""}`.trim();
        form.setValue("fullname", fullname);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = useCallback(
    async (values: PersonFormValues) => {
      const isEditing = mode === "edit";
      const message = isEditing ? "actualizada" : "creada";

      const commonPayload = {
        party_number_rop: values.party_number_rop || null,
        dni: values.dni,
        gender: values.gender,
        name: values.name,
        lastname: values.lastname,
        fullname: values.fullname,
        image_url: values.image_url || null,
        image_candidate_url: values.image_candidate_url || null,
        birth_date: values.birth_date || null,
        place_of_birth: values.place_of_birth || null,
        profession: values.profession || null,
        secondary_school: values.secondary_school,
        technical_education: values.technical_education || [],
        no_university_education: values.no_university_education || [],
        university_education: values.university_education || [],
        postgraduate_education: values.postgraduate_education || [],
        work_experience: values.work_experience || [],
        political_role: values.political_role || [],
        popular_election: values.popular_election || [],
        incomes: values.incomes || [],
        assets: values.assets || [],
        facebook_url: values.facebook_url || null,
        twitter_url: values.twitter_url || null,
        instagram_url: values.instagram_url || null,
        tiktok_url: values.tiktok_url || null,
      };

      try {
        let result;

        if (isEditing) {
          const updatePayload: UpdatePersonRequest = {
            ...commonPayload,
            id: values.id,
          };
          result = await updatePerson(updatePayload);
        } else {
          const createPayload: CreatePersonRequest = {
            ...commonPayload,
          };
          result = await createPerson(createPayload);
        }

        if (!result.success) {
          throw new Error(
            result.error || `Error al ${message.slice(0, -1)} la persona`,
          );
        }

        toast.success(`Persona ${message} exitosamente`);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Error al ${message.slice(0, -1)} la persona`;
        toast.error(errorMessage);
        console.error(`Error en onSubmit (${mode}):`, error);
      }
    },
    [mode, onOpenChange, router],
  );

  const cleanArrayData = <T extends Record<string, unknown>>(
    arrayData: T[] | null | undefined,
  ): T[] => {
    if (!Array.isArray(arrayData)) return [];

    return arrayData.map((item) => {
      const cleanItem = {} as T;

      (Object.keys(item) as Array<keyof T>).forEach((key) => {
        const value = item[key];

        cleanItem[key] = (value ?? "") as T[keyof T];
      });

      return cleanItem;
    });
  };

  const handleAutoFill = async () => {
    const rop = form.getValues("party_number_rop");
    const dni = form.getValues("dni");

    if (!rop || !dni || dni.length < 8) {
      toast.warning(
        "Ingresa el N° ROP y un DNI válido (8 dígitos) para buscar.",
      );
      return;
    }

    setLoadingJNE(true);
    toast.info("Consultando JNE (esto toma unos segundos)...");

    try {
      const result = await fetchCandidateFromJNE(rop, dni);

      if (typeof result !== "object" || !("success" in result)) {
        throw new Error("Respuesta inesperada del servidor");
      }

      if (!result.success || !("data" in result) || !result.data) {
        throw new Error(result.error || "No se encontraron datos");
      }

      const data = result.data;

      // Datos Generales
      form.setValue("name", data.name, { shouldValidate: true });
      form.setValue("lastname", data.lastname, { shouldValidate: true });
      form.setValue("gender", data.gender);
      if (data.birth_date) {
        const [day, month, year] = data.birth_date.split("/");
        if (day && month && year) {
          const isoDate = `${year}-${month}-${day}`;
          form.setValue("birth_date", isoDate, { shouldValidate: true });
        } else {
          form.setValue("birth_date", data.birth_date);
        }
      }
      form.setValue("place_of_birth", data.place_of_birth);
      // La foto
      if (data.image_candidate_url) {
        form.setValue("image_candidate_url", data.image_candidate_url);
      }

      // Checkbox Secundaria
      form.setValue("secondary_school", data.secondary_school);

      form.setValue(
        "technical_education",
        cleanArrayData(data.technical_education),
      );
      form.setValue(
        "no_university_education",
        cleanArrayData(data.no_university_education),
      );
      form.setValue(
        "university_education",
        cleanArrayData(data.university_education),
      );
      form.setValue(
        "postgraduate_education",
        cleanArrayData(data.postgraduate_education),
      );
      form.setValue("work_experience", cleanArrayData(data.work_experience));
      form.setValue("political_role", cleanArrayData(data.political_role));
      form.setValue("popular_election", cleanArrayData(data.popular_election));
      form.setValue("incomes", cleanArrayData(data.incomes));
      form.setValue("assets", cleanArrayData(data.assets) || []);

      toast.success("¡Datos importados del JNE exitosamente!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al obtener datos",
      );
    } finally {
      setLoadingJNE(false);
    }
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-5xl min-h-[90vh] flex flex-col overflow-hidden">
        <CredenzaHeader>
          <CredenzaTitle>
            {mode === "create" ? "Registrar Persona" : "Editar Persona"}
          </CredenzaTitle>
          <CredenzaDescription>
            {mode === "create"
              ? "Ingresa los datos para registrar una nueva persona."
              : "Modifica la información de la persona."}
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-1"
            >
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed flex flex-col sm:flex-row gap-4 items-end">
                <FormField
                  control={form.control}
                  name="party_number_rop"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Organización Política (ROP)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 1366"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>DNI</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 10001088" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={loadingJNE}
                >
                  {loadingJNE ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  {loadingJNE ? "Buscando..." : "Importar JNE"}
                </Button>
              </div>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="education">Educación</TabsTrigger>
                  <TabsTrigger value="experience">Experiencia</TabsTrigger>
                  <TabsTrigger value="political">Político</TabsTrigger>
                  <TabsTrigger value="financial">Financiero</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dni"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DNI *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="12345678"
                                {...field}
                                maxLength={8}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="party_number_rop"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número ROP</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Número de registro"
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellidos *</FormLabel>
                            <FormControl>
                              <Input placeholder="Pérez García" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fullname"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                            <FormDescription>
                              Se genera automáticamente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Género</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Masculino">
                                  Masculino
                                </SelectItem>
                                <SelectItem value="Femenino">
                                  Femenino
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="birth_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <CalendarDatePicker
                                date={{
                                  from: field.value
                                    ? new Date(field.value)
                                    : undefined,
                                  to: field.value
                                    ? new Date(field.value)
                                    : undefined,
                                }}
                                onDateSelect={({ from }) => {
                                  if (from)
                                    form.setValue(
                                      "birth_date",
                                      from.toISOString().split("T")[0],
                                    );
                                }}
                                variant="outline"
                                numberOfMonths={1}
                                yearsRange={100}
                                closeOnSelect
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profesión</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Abogado, Economista"
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="place_of_birth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lugar de Nacimiento</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: El Tambo, Huancayo, Junín"
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="image_url"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>URL Imagen Legislador</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="https://..."
                                value={field.value || ""}
                                onChange={field.onChange}
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="image_candidate_url"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>URL Imagen de Candidato</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="https://..."
                                value={field.value || ""}
                                onChange={field.onChange}
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondary_school"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 md:col-span-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Educación Secundaria Completa
                              </FormLabel>
                              <FormDescription>
                                Marcar si completó la educación secundaria
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                      Redes Sociales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="facebook_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://facebook.com/..."
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="twitter_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter / X</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://twitter.com/..."
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instagram_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://instagram.com/..."
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tiktok_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TikTok</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://tiktok.com/@..."
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="education" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Educación Técnica
                    </h3>
                    <FormField
                      control={form.control}
                      name="technical_education"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <EducationManager
                              value={field.value}
                              onChange={field.onChange}
                              title="Educación Técnica"
                              fields={[
                                {
                                  key: "graduate_school",
                                  label: "Institución",
                                  placeholder: "Nombre de la institución",
                                },
                                {
                                  key: "career",
                                  label: "Carrera",
                                  placeholder: "Nombre de la carrera",
                                },
                                {
                                  key: "concluded",
                                  label: "Concluido",
                                  placeholder: "Sí/No",
                                },
                              ]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Educación No Universitaria
                    </h3>
                    <FormField
                      control={form.control}
                      name="no_university_education"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <EducationManager
                              value={field.value}
                              onChange={field.onChange}
                              title="Educación No Universitaria"
                              fields={[
                                {
                                  key: "graduate_school",
                                  label: "Institución",
                                  placeholder: "Nombre de la institución",
                                },
                                {
                                  key: "career",
                                  label: "Carrera",
                                  placeholder: "Nombre de la carrera",
                                },
                                {
                                  key: "concluded",
                                  label: "Concluido",
                                  placeholder: "Sí/No",
                                },
                              ]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Educación Universitaria
                    </h3>
                    <FormField
                      control={form.control}
                      name="university_education"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <UniversityEducationManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Educación de Posgrado
                    </h3>
                    <FormField
                      control={form.control}
                      name="postgraduate_education"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <EducationManager
                              value={field.value}
                              onChange={field.onChange}
                              title="Posgrado"
                              fields={[
                                {
                                  key: "graduate_school",
                                  label: "Universidad",
                                  placeholder: "Universidad",
                                },
                                {
                                  key: "specialization",
                                  label: "Especialización",
                                  placeholder: "Área de especialización",
                                },
                                {
                                  key: "degree",
                                  label: "Grado",
                                  placeholder: "Maestría/Doctorado",
                                },
                                {
                                  key: "concluded",
                                  label: "Concluido",
                                  placeholder: "Sí/No",
                                },
                                {
                                  key: "year_of_completion",
                                  label: "Año",
                                  placeholder: "Año de conclusión",
                                },
                              ]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Experiencia Laboral
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Historial profesional de la persona
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="work_experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <WorkExperienceManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="political" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Roles Políticos
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cargos en organizaciones políticas
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="political_role"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <PoliticalRoleManager
                              value={field.value}
                              onChange={field.onChange}
                              title="Rol Político"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Elecciones Populares
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cargos obtenidos por elección popular
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="popular_election"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <PoliticalRoleManager
                              value={field.value}
                              onChange={field.onChange}
                              title="Elección Popular"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Declaración de Ingresos
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registro de ingresos declarados
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="incomes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <IncomesManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Bienes y Activos
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Declaración de bienes patrimoniales
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="assets"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <AssetsManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CredenzaBody>

        <CredenzaFooter className="border-t pt-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "Registrar Persona" : "Guardar Cambios"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
