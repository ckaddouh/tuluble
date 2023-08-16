const express = require('express');
var router = express.Router();
const db = require("../db/procedure_queries.js");

var colName = "";

router.post("/:project_id/procformsubmit", async function (req, res) {

  console.log("\n\nN PROCEDURE FUNCTION");

    let project_id = req.params.project_id

    let theProcedure = req.body.theProcedure;
    let procComments = req.body.procComments;
    let initialTemp = req.body.initialTemp;
    let finalTemp = req.body.finalTemp;
    let timing = req.body.timing;
    let initialMixSpeed = req.body.initialMixSpeed;
    let finalMixSpeed = req.body.finalMixSpeed;
    let mixerType = req.body.mixerType;
    let blade = req.body.blade;

    const maxPhase = await new Promise((resolve, reject) => {
      db.get_max_phase(project_id, (error, maxPhase) => {
        if (error) reject (error);
        else resolve(maxPhase);
      });
    });

    let phaseNumber = maxPhase[0].max + 1;
  
  
    db.insert_procedure(phaseNumber, theProcedure, procComments, initialTemp, finalTemp, timing, initialMixSpeed,
      finalMixSpeed, mixerType, blade, project_id, (error, results) => {
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

  
router.get("/:project_id/cellEdited/:phase/:column/:cellContent", (req, res) => {
  let cellContent = req.params.cellContent;
  let phase = req.params.phase;
  let column = req.params.column;
  let project_id = req.params.project_id;

  console.log("IN PROCEDURE EDIT");
  console.log(cellContent);



  const colList = ["phase_num", "proc", "comments", "temp_init", "temp_final", "timing", "mixing_init", "mixing_final", "mixer_type", "blade"];

  const colName = colList[column-1];

  console.log(colName);
  console.log(phase);
  console.log(project_id);

  db.edit_procedure_item(colName, cellContent, phase, project_id, (error, proc_info) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.redirect("/procedure/" + project_id);
    }
  });
});





module.exports = router;

// $(document).ready(function() {
//   $('.modal').modal();
// });
