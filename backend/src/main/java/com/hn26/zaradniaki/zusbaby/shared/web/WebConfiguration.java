package com.hn26.zaradniaki.zusbaby.shared.web;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS for the frontend and publishing the API contract.
 * <p>
 * The contract lives in {@code src/main/resources/openapi/openapi.yaml} (single
 * source of truth). It is served under the API prefix as
 * {@code /api/v1/openapi.yaml} (behind the reverse proxy only {@code /api/**}
 * reliably reaches the backend), and Swagger UI
 * ({@code /swagger-ui/index.html}) displays that file.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(WebProperties.class)
@RequiredArgsConstructor
class WebConfiguration implements WebMvcConfigurer {

    /**
     * Under the API prefix: behind the reverse proxy only /api/** reliably reaches
     * the backend.
     */
    static final String SPEC_PATTERN = "/api/v1/*.yaml";

    private final WebProperties properties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(properties.allowedOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS").allowedHeaders("*")
                .allowCredentials(false).maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(SPEC_PATTERN).addResourceLocations("classpath:/openapi/");
    }
}
