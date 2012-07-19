using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Nancy;
using Nancy.ModelBinding;
using JQueryDemo.Models;

namespace JQueryDemo
{
    public class JQDemo : NancyModule
    {
        public JQDemo()
        {
            Get["/"] = x =>
            {
                return View["Index"];
            };

            Post["/register"] = x =>
            {
                var user = this.Bind<User>();
                return HttpStatusCode.OK;
            };
        }
    }
}