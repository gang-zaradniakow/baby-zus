package com.hn26.archfixtures.good.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.archfixtures.good.application.query.GetChild;
import org.springframework.web.bind.annotation.RestController;

@RestController
class GoodController {

    private final Pipeline pipeline;

    GoodController(Pipeline pipeline) {
        this.pipeline = pipeline;
    }

    String child(String id) {
        return pipeline.send(new GetChild(id));
    }
}
