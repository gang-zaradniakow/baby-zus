package com.hn26.zaradniaki.zusbaby.identity.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.CurrentUserDto;
import com.hn26.zaradniaki.zusbaby.api.model.TokensDto;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.IssuedTokensDto;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.UserDto;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Command and query results → generated REST DTOs. */
@Mapper(config = MapStructConfig.class)
interface IdentityWebMapper {

    @Mapping(target = "tokenType", constant = "BEARER")
    TokensDto toResponse(IssuedTokensDto tokens);

    CurrentUserDto toResponse(UserDto user);
}
