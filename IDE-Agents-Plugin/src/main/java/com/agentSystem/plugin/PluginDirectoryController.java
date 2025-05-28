package com.junie.plugin;

import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectManager;
import com.intellij.openapi.util.text.StringUtil;
import com.intellij.util.io.HttpRequests;
import com.intellij.util.io.HttpResponseStatus;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.jetbrains.ide.RestService;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Optional;

/**
 * REST controller that provides access to plugin installation directories.
 */
public class PluginDirectoryController extends RestService {
    private static final Logger LOG = Logger.getInstance(PluginDirectoryController.class);
    private static final String API_PREFIX = "/api/plugin-directory";

    @NotNull
    @Override
    protected String getServiceName() {
        return "junie-plugin-directory";
    }

    @Override
    protected boolean isMethodSupported(@NotNull HttpMethod method) {
        return method == HttpMethod.GET;
    }

    @Override
    protected boolean isOriginAllowed(@NotNull String origin) {
        return true; // Allow all origins for simplicity
    }

    @Override
    public boolean process(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response, @NotNull String path) throws IOException {
        if (!path.startsWith(API_PREFIX)) {
            return false;
        }

        String subPath = path.substring(API_PREFIX.length());
        if (StringUtil.isEmpty(subPath) || subPath.equals("/")) {
            sendPluginsPath(response);
            return true;
        }

        if (subPath.startsWith("/plugin/")) {
            String pluginId = subPath.substring("/plugin/".length());
            sendPluginPath(response, pluginId);
            return true;
        }

        if (subPath.equals("/junie")) {
            sendJuniePluginPath(response);
            return true;
        }

        if (subPath.startsWith("/directory/")) {
            String directoryName = subPath.substring("/directory/".length());
            sendPluginPathByDirectoryName(response, directoryName);
            return true;
        }

        response.sendError(HttpServletResponse.SC_NOT_FOUND, "Unknown path: " + path);
        return true;
    }

    private void sendPluginsPath(@NotNull HttpServletResponse response) throws IOException {
        Project project = getDefaultProject();
        if (project == null) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "No project available");
            return;
        }

        PluginDirectoryService service = PluginDirectoryService.getInstance(project);
        Path pluginsPath = service.getPluginsPath();
        
        response.setContentType("application/json");
        response.getWriter().write("{\"pluginsPath\":\"" + pluginsPath.toString().replace("\\", "\\\\") + "\"}");
    }

    private void sendPluginPath(@NotNull HttpServletResponse response, @NotNull String pluginId) throws IOException {
        Project project = getDefaultProject();
        if (project == null) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "No project available");
            return;
        }

        PluginDirectoryService service = PluginDirectoryService.getInstance(project);
        Optional<Path> pluginPath = service.getPluginPath(pluginId);
        
        response.setContentType("application/json");
        if (pluginPath.isPresent()) {
            response.getWriter().write("{\"pluginId\":\"" + pluginId + "\",\"pluginPath\":\"" + 
                pluginPath.get().toString().replace("\\", "\\\\") + "\"}");
        } else {
            response.getWriter().write("{\"pluginId\":\"" + pluginId + "\",\"pluginPath\":null,\"error\":\"Plugin not found\"}");
        }
    }

    private void sendJuniePluginPath(@NotNull HttpServletResponse response) throws IOException {
        Project project = getDefaultProject();
        if (project == null) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "No project available");
            return;
        }

        PluginDirectoryService service = PluginDirectoryService.getInstance(project);
        Optional<Path> juniePath = service.getJuniePluginPath();
        
        response.setContentType("application/json");
        if (juniePath.isPresent()) {
            response.getWriter().write("{\"pluginId\":\"junie\",\"pluginPath\":\"" + 
                juniePath.get().toString().replace("\\", "\\\\") + "\"}");
        } else {
            response.getWriter().write("{\"pluginId\":\"junie\",\"pluginPath\":null,\"error\":\"Junie plugin not found\"}");
        }
    }

    private void sendPluginPathByDirectoryName(@NotNull HttpServletResponse response, @NotNull String directoryName) throws IOException {
        Project project = getDefaultProject();
        if (project == null) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "No project available");
            return;
        }

        PluginDirectoryService service = PluginDirectoryService.getInstance(project);
        Path pluginPath = service.getPluginPathByDirectoryName(directoryName);
        
        response.setContentType("application/json");
        response.getWriter().write("{\"directoryName\":\"" + directoryName + "\",\"pluginPath\":\"" + 
            pluginPath.toString().replace("\\", "\\\\") + "\"}");
    }

    @Nullable
    private Project getDefaultProject() {
        ProjectManager projectManager = ProjectManager.getInstance();
        Project[] openProjects = projectManager.getOpenProjects();
        
        if (openProjects.length > 0) {
            return openProjects[0];
        }
        
        return projectManager.getDefaultProject();
    }
}