package com.hn26.zaradniaki.zusbaby.shared.mapping;

import org.mapstruct.InjectionStrategy;
import org.mapstruct.MapperConfig;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

/**
 * Shared configuration for every mapper:
 * {@code @Mapper(config = MapStructConfig.class)}.
 * <ul>
 * <li>mappers are Spring beans injected through constructors,</li>
 * <li>an unmapped target property fails the build instead of silently losing
 * data,</li>
 * <li>value objects of the shared kernel are converted by
 * {@link ValueObjectMappers}.</li>
 * </ul>
 */
@MapperConfig(componentModel = MappingConstants.ComponentModel.SPRING, injectionStrategy = InjectionStrategy.CONSTRUCTOR, unmappedTargetPolicy = ReportingPolicy.ERROR, uses = ValueObjectMappers.class)
public interface MapStructConfig {
}
