import{r,u,j as s,M as l,P as m,_ as p}from"./index-OW-KEF2N.js";function g(){const[t,d]=r.useState(null),{mutate:a,isPending:n,isSuccess:o}=u(),i=async c=>{const e={...c};console.log({newData:e}),t&&(e.image=t),a({url:"api/post/create",newData:e}),o&&p.success("Created Successfully")};return s.jsxs("div",{className:"new_post_page",children:[s.jsx("h1",{children:"Create new post"}),n&&s.jsx(l,{}),s.jsx(m,{onSubmit:i,initialValue:{}})]})}export{g as default};
