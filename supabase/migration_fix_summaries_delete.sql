-- Remove the old policy that allowed uploaders to delete their own summaries
DROP POLICY IF EXISTS "Allow users to delete own exam_summaries or admin" ON public.exam_summaries;

-- Create a new policy that ONLY allows admins to delete summaries
CREATE POLICY "Allow admin to delete exam_summaries" ON public.exam_summaries 
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    );
