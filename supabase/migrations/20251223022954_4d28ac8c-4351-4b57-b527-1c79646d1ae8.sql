-- Create user_activity table to track login/logout and user actions
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'prediction', 'recommendation'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient user activity queries
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX idx_user_activity_type ON public.user_activity(activity_type);

-- Enable Row Level Security
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and insert their own activity
CREATE POLICY "Users can view own activity"
  ON public.user_activity
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.user_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);