package com.hn26.zaradniaki.zusbaby.legalrules.application.mapper;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.LegalParameters;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSet;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterValue;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import java.util.List;
import org.mapstruct.Mapper;

/** Aggregate → query result. */
@Mapper(config = MapStructConfig.class)
public interface LegalParametersDtoMapper {

    LegalParametersDto toDto(ParameterSet parameterSet);

    /** One entry per {@link ParameterKey}, in declaration order. */
    default List<ParameterDto> toParameters(LegalParameters parameters) {
        return parameters.asMap().entrySet().stream().map(entry -> toParameter(entry.getKey(), entry.getValue()))
                .toList();
    }

    private static ParameterDto toParameter(ParameterKey key, ParameterValue value) {
        return switch (value) {
            case ParameterValue.Single single -> new ParameterDto(key, key.kind(), key.label(), single.value(), null);
            case ParameterValue.ByChildren byChildren ->
                new ParameterDto(key, key.kind(), key.label(), null, byChildren.values());
        };
    }
}
