"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormInput, FormSelect } from "@/components/forms";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ROLE_LABELS } from "@/config/navigation";
import { updateProfile } from "@/features/auth/authSlice";
import { OFFICES } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";
import { profileSchema, type ProfileFormValues } from "../schemas";

export function ProfileForm() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      position: user?.position ?? "",
      office: user?.office ?? "",
      phone: user?.phone ?? "",
    },
  });

  if (!user) return null;

  const onSubmit = async (values: ProfileFormValues) => {
    await new Promise((r) => setTimeout(r, 400));
    dispatch(updateProfile(values));
    reset(values);
    dispatch(showToast({ variant: "success", title: "Profile updated" }));
  };

  return (
    <Card>
      <CardHeader title="Profile" description="Your personal information shown across NGAS." />
      <CardBody>
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="font-heading text-lg font-bold text-ink-900">{user.name}</p>
            <p className="text-sm text-neutral-500">{user.email}</p>
            <p className="mt-1 text-xs font-semibold text-brand-700">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Full name" required autoComplete="name" error={errors.name?.message} {...register("name")} />
          <FormInput label="Email address" type="email" value={user.email} disabled readOnly hint="Contact your administrator to change your email." />
          <FormInput label="Position / Designation" required error={errors.position?.message} {...register("position")} />
          <FormSelect label="Office" required options={OFFICES} error={errors.office?.message} {...register("office")} />
          <FormInput label="Mobile number" type="tel" autoComplete="tel" placeholder="09171234567" error={errors.phone?.message} {...register("phone")} />
          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <Button variant="outline" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
              Discard
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save profile
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
