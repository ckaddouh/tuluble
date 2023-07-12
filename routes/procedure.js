const express = require('express');
var router = express.Router();
const db = require("../db/procedure_queries.js");

var colName = "";

router.post("/:project_id/procformsubmit", (req, res) => {

  console.log("\n\nN PROCEDURE FUNCTION");

    let project_id = req.params.project_id
    let trial_num = req.params.trial_num
  
    let userInput1 = req.body.userInput1;
    let userInput2 = req.body.userInput2;
    let userInput3 = req.body.userInput3;
    let userInput4 = req.body.userInput4;
    let userInput5 = req.body.userInput5;
    let userInput6 = req.body.userInput6;
    let userInput7 = req.body.userInput7;
    let userInput8 = req.body.userInput8;
    let userInput9 = req.body.userInput9;
    let userInput10 = req.body.userInput10;
  
  
    db.insert_procedure(userInput1, userInput2, userInput3, userInput4, userInput5, userInput6, userInput7,
      userInput8, userInput9, userInput10, project_id, (error, results) => {
        if (error) {
          res.status(500).send(error); 
        }
        else {
          res.redirect("/procedure/" + project_id);
        }
      });
  });
  
router.get("/:project_id", async function (req, res) {
  let project_id = req.params.project_id

  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  if (admin[0].admin === 0 || admin[0].admin === 1) {
    db.get_procedure(project_id, (error, results) => {
      db.get_procedure_info(project_id, (error, proc_info) => {
        if (error)
          res.status(500).send(error); //Internal Server Error 
        else {
          res.render('procedure', {
            results: results,
            procedure_info: proc_info,
            project_id: project_id,
            isAdmin: admin[0].admin
          });
        }
      });
    });
  }
  else {
    res.redirect("/inventory");
  }
});


router.get("/:project_id/deleteProcedureStep/:proc_id", (req, res) => {
  let proc_id = req.params.proc_id
  let project_id = req.params.project_id

  db.delete_procedure_item(proc_id, (error, results) => {
    if (error) {
      res.status(500).send(error); 
    }
    else {
      res.redirect("/procedure/" + project_id);
    }
  });
});

  
// router.get("/:project_id/cellEdited/:phase/:column/:cellContent", (req, res) => {
//   let cellContent = req.params.cellContent;
//   let phase = req.params.phase;
//   let column = req.params.column;
//   let project_id = req.params.project_id;


//   const colList = ["phase_num", "proc", "comments", "temp_init", "temp_final", "timing", "mixing_init", "mixing_final", "mixer_type", "blade"];

//   const colName = colList[column];

//   const edit_procedure_query = "UPDATE procedure_item SET " + colName + " = ? WHERE phase_num = ? AND project_id = ?";

//   db.execute(edit_procedure_query, [cellContent, phase, project_id], (error, proc_info) => {
//     if (error)
//       res.status(500).send(error); //Internal Server Error 
//     else {
//       res.redirect("/procedure/" + project_id);
//     }
//   });

// });




module.exports = router;
