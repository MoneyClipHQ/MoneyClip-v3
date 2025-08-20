import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Upload, X, Eye, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdvisorDropdown from "@/components/advisor-dropdown";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Advisor, 
  AdvisorSettings, 
  UpdateContactInfo, 
  UpdateCompliance, 
  UpdateBranding 
} from "@shared/schema";
import { 
  updateContactInfoSchema, 
  updateComplianceSchema, 
  updateBrandingSchema 
} from "@shared/schema";

// Mock advisor data - in a real app, this would come from auth context
const mockAdvisor: Advisor = {
  id: "advisor-1",
  advisorName: "Sarah Chen",
  companyName: "Chen Financial Advisory",
  email: "sarah@chenfinancial.com",
  password: "", // Never expose in real app
  createdAt: new Date(),
};

const defaultDisclosure = "By accessing this video, you acknowledge that the information provided is for educational purposes only and does not constitute financial advice. Please consult with a qualified financial professional before making any investment decisions.";

export default function Settings() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("contact");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [contrastWarning, setContrastWarning] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch advisor settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["/api/settings", mockAdvisor.id]
  });

  // Use data from API, fallback to defaults if not available
  const advisor = settingsData?.advisor || mockAdvisor;
  const displaySettings = settingsData?.settings;

  // Contact Info Form
  const contactForm = useForm<UpdateContactInfo>({
    resolver: zodResolver(updateContactInfoSchema),
    defaultValues: {
      advisorName: advisor.advisorName,
      companyName: advisor.companyName,
      email: advisor.email,
      phone: displaySettings?.phone || "",
      calendarLink: displaySettings?.calendarLink || "",
    },
  });

  // Compliance Form
  const complianceForm = useForm<UpdateCompliance>({
    resolver: zodResolver(updateComplianceSchema),
    defaultValues: {
      disclosureText: displaySettings?.disclosureText || defaultDisclosure,
    },
  });

  // Branding Form
  const brandingForm = useForm<UpdateBranding>({
    resolver: zodResolver(updateBrandingSchema),
    defaultValues: {
      logoUrl: displaySettings?.logoUrl || "",
      primaryColor: displaySettings?.primaryColor || "#2563eb",
      secondaryColor: displaySettings?.secondaryColor || "#1e40af",
    },
  });

  // Mutations for autosave
  const updateContactMutation = useMutation({
    mutationFn: (data: UpdateContactInfo) => apiRequest("PATCH", "/api/settings/contact", data),
    onSuccess: () => {
      toast({
        title: "Saved",
        description: "Contact information updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save contact information",
        variant: "destructive",
      });
    },
  });

  const updateComplianceMutation = useMutation({
    mutationFn: (data: UpdateCompliance) => apiRequest("PATCH", "/api/settings/compliance", data),
    onSuccess: () => {
      toast({
        title: "Saved",
        description: "Compliance settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save compliance settings",
        variant: "destructive",
      });
    },
  });

  const updateBrandingMutation = useMutation({
    mutationFn: (data: UpdateBranding) => apiRequest("PATCH", "/api/settings/branding", data),
    onSuccess: () => {
      toast({
        title: "Saved",
        description: "Branding settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive",
      });
    },
  });

  // Auto-save handlers
  const handleContactBlur = (field: keyof UpdateContactInfo) => {
    const value = contactForm.getValues(field);
    if (contactForm.formState.isValid) {
      updateContactMutation.mutate(contactForm.getValues());
    }
  };

  const handleComplianceBlur = () => {
    if (complianceForm.formState.isValid) {
      updateComplianceMutation.mutate(complianceForm.getValues());
    }
  };

  const handleBrandingChange = (field: keyof UpdateBranding) => {
    if (brandingForm.formState.isValid) {
      updateBrandingMutation.mutate(brandingForm.getValues());
    }
  };

  // Logo upload handler
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      brandingForm.setValue("logoUrl", result);
      handleBrandingChange("logoUrl");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    brandingForm.setValue("logoUrl", "");
    handleBrandingChange("logoUrl");
  };

  // Color contrast check
  const checkContrast = (bgColor: string, textColor: string = "#ffffff") => {
    // Basic contrast check - in production, use a proper contrast ratio calculator
    const bg = bgColor.replace('#', '');
    const r = parseInt(bg.substr(0, 2), 16);
    const g = parseInt(bg.substr(2, 2), 16);
    const b = parseInt(bg.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    if (luminance > 0.7) {
      return "Consider using a darker color for better contrast with white text";
    }
    return null;
  };

  // Watch for color changes to check contrast
  useEffect(() => {
    const subscription = brandingForm.watch((value, { name }) => {
      if (name === "primaryColor" && value.primaryColor) {
        const warning = checkContrast(value.primaryColor);
        setContrastWarning(warning);
      }
    });
    return () => subscription.unsubscribe();
  }, [brandingForm]);

  const restoreDefaultDisclosure = () => {
    complianceForm.setValue("disclosureText", defaultDisclosure);
    updateComplianceMutation.mutate({ disclosureText: defaultDisclosure });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                data-testid="button-back-dashboard"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
            <AdvisorDropdown
              advisorName={mockAdvisor.advisorName}
              onSettings={() => {}} // Already on settings page
              onSignOut={() => console.log("Sign out clicked")}
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact" data-testid="tab-contact-info">Contact Info</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
            <TabsTrigger value="branding" data-testid="tab-branding">Branding</TabsTrigger>
          </TabsList>

          {/* Contact Info Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <p className="text-sm text-gray-600">
                  This information appears on viewer pages and in sharing flows.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...contactForm}>
                  <form className="space-y-4">
                    <FormField
                      control={contactForm.control}
                      name="advisorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Advisor Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-advisor-name"
                              onBlur={() => handleContactBlur("advisorName")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contactForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-company-name"
                              onBlur={() => handleContactBlur("companyName")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contactForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              data-testid="input-email"
                              onBlur={() => handleContactBlur("email")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contactForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              data-testid="input-phone"
                              onBlur={() => handleContactBlur("phone")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contactForm.control}
                      name="calendarLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calendar/Scheduler Link</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="https://calendly.com/yourname"
                              data-testid="input-calendar-link"
                              onBlur={() => handleContactBlur("calendarLink")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                
                {/* Save indicator */}
                {updateContactMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Saving...
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Last updated: {displaySettings?.updatedAt?.toLocaleString() || "Never"}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Terms & Disclosure</CardTitle>
                <p className="text-sm text-gray-600">
                  This text is shown to viewers before they can access your videos.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...complianceForm}>
                  <form className="space-y-4">
                    <FormField
                      control={complianceForm.control}
                      name="disclosureText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disclosure Text</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={8}
                              data-testid="textarea-disclosure"
                              onBlur={handleComplianceBlur}
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{field.value?.length || 0} / 5000 characters</span>
                            <span>Plain text only</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                
                <div className="flex gap-2">
                  <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-preview-gate">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Gate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Terms & Disclosure Preview</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {complianceForm.getValues("disclosureText")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" disabled>
                            Accept & Continue
                          </Button>
                          <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Close Preview
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-restore-default">
                        Restore Default
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restore Default Disclosure</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will replace your current disclosure text with the default text. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={restoreDefaultDisclosure}>
                          Restore Default
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                {/* Save indicator */}
                {updateComplianceMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Saving...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Logo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {logoPreview || displaySettings?.logoUrl ? (
                        <div className="space-y-4">
                          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                              src={logoPreview || displaySettings?.logoUrl!}
                              alt="Logo preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                              data-testid="button-replace-logo"
                            >
                              Replace
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={removeLogo}
                              data-testid="button-remove-logo"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <div>
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                              data-testid="button-upload-logo"
                            >
                              Upload Logo
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Brand Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Form {...brandingForm}>
                      <form className="space-y-4">
                        <FormField
                          control={brandingForm.control}
                          name="primaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Color</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={field.value}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      handleBrandingChange("primaryColor");
                                    }}
                                    className="w-12 h-10 rounded border border-gray-300"
                                    data-testid="input-primary-color"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#2563eb"
                                    data-testid="input-primary-color-hex"
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      handleBrandingChange("primaryColor");
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={brandingForm.control}
                          name="secondaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Color</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={field.value}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      handleBrandingChange("secondaryColor");
                                    }}
                                    className="w-12 h-10 rounded border border-gray-300"
                                    data-testid="input-secondary-color"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#1e40af"
                                    data-testid="input-secondary-color-hex"
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      handleBrandingChange("secondaryColor");
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                    
                    {contrastWarning && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <strong>Contrast Warning:</strong> {contrastWarning}
                        </div>
                      </div>
                    )}
                    
                    {/* Save indicator */}
                    {updateBrandingMutation.isPending && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Saving...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Live Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <p className="text-sm text-gray-600">
                    How your branding will appear to viewers
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    {/* Mock viewer header */}
                    <div className="bg-white p-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(logoPreview || displaySettings?.logoUrl) ? (
                          <img
                            src={logoPreview || displaySettings?.logoUrl!}
                            alt="Logo"
                            className="h-8 w-auto"
                          />
                        ) : (
                          <div className="w-20 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                            Logo
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Client Name
                      </div>
                    </div>
                    
                    {/* Mock page background */}
                    <div 
                      className="h-32 flex items-center justify-center"
                      style={{ backgroundColor: brandingForm.getValues("primaryColor") }}
                    >
                      <div className="text-white text-center">
                        <div className="text-lg font-semibold">Video Title</div>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          style={{ backgroundColor: brandingForm.getValues("secondaryColor") }}
                        >
                          Play Video
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}