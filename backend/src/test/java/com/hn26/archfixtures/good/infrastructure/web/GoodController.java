package com.hn26.archfixtures.good.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.archfixtures.good.api.ChildApi;
import com.hn26.archfixtures.good.application.query.GetChildQuery;
import org.springframework.web.bind.annotation.RestController;

@RestController
class GoodController implements ChildApi {

    private final Pipeline pipeline;

    GoodController(Pipeline pipeline) {
        this.pipeline = pipeline;
    }

    @Override
    public String child(String id) {
        return pipeline.send(new GetChildQuery(id));
    }
}
