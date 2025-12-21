-- Create OTP codes table for secure OTP storage
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Create index for efficient email lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Create rate limiting table for OTP requests
CREATE TABLE public.otp_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  first_request_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_request_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for rate limiting by email
CREATE UNIQUE INDEX idx_otp_rate_limits_email ON public.otp_rate_limits(email);

-- Enable RLS on both tables
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create function to clean up expired OTPs (runs periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete expired OTPs older than 1 hour
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  -- Reset rate limits older than 10 minutes
  DELETE FROM public.otp_rate_limits 
  WHERE first_request_at < NOW() - INTERVAL '10 minutes';
END;
$$;