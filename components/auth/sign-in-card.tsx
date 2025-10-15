'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SignInFlow } from "@/types/schema";
import { getCurrentUser, signIn, signInWithRedirect } from "aws-amplify/auth";
import { useFormik } from "formik";
import * as Yup from "yup";

interface SignInCardProps {
  setState: (state: SignInFlow) => void;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export const SignInCard = ({ setState }: SignInCardProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {

    getCurrentUser()
      .then((user) => {

        router.push("/landing");
      })
      .catch((error) => {
        console.log("User is NOT authenticated:", error);
        
      });
  }, [router]);



  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);
      try {
        const { isSignedIn, nextStep } = await signIn({
          username: values.email,
          password: values.password,
        });

        if (isSignedIn) {
          setIsSuccess(true);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await router.push("/landing");
        } else {
          console.log("Sign in requires additional steps:", nextStep);
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error("Error signing in:", err);
        setError(
          err instanceof Error ? err.message : "Invalid email or password",
        );
        setIsSubmitting(false);
      }
    },
  });

const handleGoogleSignIn = async () => {
  console.log("Google sign-in clicked");
  setError(null);
  
  try {
    console.log("Initiating Google OAuth flow...");
    
    // Use the provider configuration directly
    await signInWithRedirect({ 
      provider: 'Google' 
    });
    
    // The redirect should happen automatically
    console.log("Redirect initiated to OAuth provider");
    
  } catch (error) {
    console.error('Error signing in with Google:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('oauth') || error.message.includes('redirect')) {
        setError('OAuth configuration issue. Please check your Amplify setup.');
        console.error('OAuth configuration problem detected');
      } else {
        setError(`Sign-in failed: ${error.message}`);
      }
    } else {
      setError('An unexpected error occurred during Google sign-in');
    }
  }
};

  return (
    <Card className="w-full h-full px-8 py-6">
      <div className="flex items-center w-full justify-center">
        <Image
          src="/assets/logo.png"
          alt="Logo"
          width={120}
          height={80}
          className="h-10 mr-2"
        />
      </div>
      <CardHeader className="px-0 pt-3 my-5">
        <CardTitle>Login to continue</CardTitle>
        <CardDescription>
          Use your email or another service to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-0 pb-0">
        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {isSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Sign in successful! Redirecting...</span>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-2.5">
          <div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              disabled={isSubmitting || isSuccess}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.email}
              </div>
            )}
          </div>

          <div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              disabled={isSubmitting || isSuccess}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.password}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              "Continue"
            )}
          </Button>
        </form>

        <Separator />
        <div className="flex flex-col gap-y-2.5">
          <Button
            id="googleSignInButton"
             //disabled={isSubmitting || isSuccess}
            disabled={true}
            onClick={handleGoogleSignIn}
            variant="outline"
            size="lg"
            className="w-full relative"
          >
            <FcGoogle className="size-5 absolute top-3 left-2.5" />
            Continue with Google
          </Button>

          {/* <Button
            id="googleSignInButton"
            onClick={handleGoogleSignIn}
            variant="outline"
            size="lg"
            className="w-full relative"
          >
            <FcGoogle className="size-5 absolute top-3 left-2.5" />
            Continue with Google
          </Button> */}

        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <span
              onClick={() => !isSubmitting && !isSuccess && setState("signUp")}
              className="text-sky-700 hover:underline cursor-pointer"
            >
              Sign up
            </span>
          </p>

          <p className="text-xs text-muted-foreground">
            Forgot your password?{" "}
            <span
              onClick={() =>
                !isSubmitting && !isSuccess && setState("forgotPassword")
              }
              className="text-sky-700 hover:underline cursor-pointer"
            >
              Reset it
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
