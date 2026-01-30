import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getAllProjectsForSync, syncProjectFromCloud, getProjectForSync } from '@/db/database';

interface CloudSyncOptions {
  // Sync on mount (e.g., when entering project list)
  syncOnMount?: boolean;
  // Current project ID to sync on unmount
  currentProjectId?: string | null;
}

export function useCloudSync(options: CloudSyncOptions = {}) {
  const { syncOnMount = false, currentProjectId = null } = options;

  const syncMutation = useMutation(api.projects.syncBatch);
  const syncSingleMutation = useMutation(api.projects.sync);
  const cloudProjects = useQuery(api.projects.listFull);

  const isSyncingRef = useRef(false);
  const currentProjectIdRef = useRef(currentProjectId);

  // Keep ref updated
  currentProjectIdRef.current = currentProjectId;

  // Sync all local projects to cloud
  const syncAllToCloud = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const localProjects = await getAllProjectsForSync();
      if (localProjects.length === 0) {
        isSyncingRef.current = false;
        return;
      }

      console.log(`[CloudSync] Syncing ${localProjects.length} projects to cloud...`);
      const results = await syncMutation({ projects: localProjects });
      console.log('[CloudSync] Sync results:', results);
    } catch (error) {
      console.error('[CloudSync] Failed to sync to cloud:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [syncMutation]);

  // Sync a single project to cloud
  const syncProjectToCloud = useCallback(async (projectId: string) => {
    if (isSyncingRef.current) return;

    try {
      const project = await getProjectForSync(projectId);
      if (!project) return;

      console.log(`[CloudSync] Syncing project "${project.name}" to cloud...`);
      const result = await syncSingleMutation(project);
      console.log('[CloudSync] Single sync result:', result);
    } catch (error) {
      console.error('[CloudSync] Failed to sync project:', error);
    }
  }, [syncSingleMutation]);

  // Sync all cloud projects to local
  const syncAllFromCloud = useCallback(async () => {
    if (!cloudProjects || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      console.log(`[CloudSync] Syncing ${cloudProjects.length} projects from cloud...`);
      const results = await Promise.all(
        cloudProjects.map(async (cp) => {
          const result = await syncProjectFromCloud(cp);
          return { localId: cp.localId, ...result };
        })
      );
      console.log('[CloudSync] Sync from cloud results:', results);
    } catch (error) {
      console.error('[CloudSync] Failed to sync from cloud:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [cloudProjects]);

  // Sync on mount if requested
  useEffect(() => {
    if (syncOnMount && cloudProjects) {
      syncAllFromCloud();
    }
  }, [syncOnMount, cloudProjects, syncAllFromCloud]);

  // Sync current project on unmount (leaving the project)
  useEffect(() => {
    return () => {
      const projectId = currentProjectIdRef.current;
      if (projectId) {
        // Use sendBeacon for reliable sync on page unload
        // For navigation within app, we'll use the regular mutation
        syncProjectToCloud(projectId);
      }
    };
  }, [syncProjectToCloud]);

  // Set up beforeunload handler for page close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Sync all projects when leaving the page
      // Note: This may not complete if the page closes too fast
      // The main sync happens on navigation within the app
      const projectId = currentProjectIdRef.current;
      if (projectId) {
        // Try to sync synchronously using sendBeacon
        const projectPromise = getProjectForSync(projectId);
        projectPromise.then((project) => {
          if (project) {
            // Use sendBeacon for more reliable delivery on unload
            const url = import.meta.env.VITE_CONVEX_URL?.replace('.cloud', '.site') + '/sync-beacon';
            navigator.sendBeacon?.(url, JSON.stringify(project));
          }
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    syncAllToCloud,
    syncAllFromCloud,
    syncProjectToCloud,
    cloudProjects,
    isSyncing: isSyncingRef.current,
  };
}
