import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { insertServiceSchema } from "@shared/schema";
import type { InsertService } from "@shared/schema";
import { useLocation } from "wouter";

const serviceGroups = [
  "Authentication",
  "Commerce",
  "Communication",
  "Data",
  "Financial",
  "Warehouse",
];

export default function Register() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<InsertService>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: "",
      url: "",
      group: "",
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: api.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health/summary"] });
      toast({
        title: "Success",
        description: "Service registered successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register service",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertService) => {
    createServiceMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center h-16 px-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Register New Service
              </h2>
              <p className="text-sm text-slate-600">
                Add a Spring Boot microservice to monitor
              </p>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className="p-6 max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-plus-circle text-blue-500 mr-3"></i>
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., User Service"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="http://localhost:8080"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceGroups.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createServiceMutation.isPending}
                    >
                      {createServiceMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner animate-spin mr-2"></i>
                          Registering...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus mr-2"></i>
                          Register Service
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
