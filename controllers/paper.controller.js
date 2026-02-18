const Topic=require("../models/Topic");
const Subject=require("../models/Subject");
const Paper=require("../models/Paper");

exports.createPaper=async(req,res)=>{
    try {
        const{
            topicId,
            year,
            season,
            paperNumber,
            variant,
            questionPaper,
            markScheme,
            explanation,
            specialComment,
        }=req.body;
       
    if (!topicId || !year || !season || !paperNumber || !variant) {
        return res.status(400).json({
          message: "Required fields are missing",
        });
      }
     const topic=await Topic.findById(topicId).select("subject");
     if(!topic){
        return res.status(404).json({
            message:"Topic not found",
        });
     } 
     const paper=await Paper.create({
        topic:topicId,
        year,
      season,
      paperNumber,
      variant,
      questionPaper,
      markScheme,
      explanation,
      specialComment,

     });
      // 3️⃣ Increment paper count in Topic
    await Topic.findByIdAndUpdate(topicId, {
        $inc: { numberOfPapers: 1 },
      });
      res.status(201).json({
        success: true,
        data: paper,
      });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
              message: "Paper already exists for this combination",
            });
          }
          console.error(error);
    }
};
exports.getPapersByTopic=async(req,res)=>{
    try {
        const{topicId}=req.params;
        const page=parseInt(req.query.page)||1;
        const limit=10;
        const skip=(page-1)*limit;
        const papers=await Paper.find({topic:topicId}).sort({year:-1}).skip(skip).limit(limit).lean();
        const total=await Paper.countDocuments({topic:topicId});
        res.status(200).json({
            success:true,
            page,
            totalPage:Math.ceil(total/limit),
            total,
            data:papers
        });

    } catch (error) {
        console.error(error);
    }
};
exports.filterPapers=async(req,res)=>{
    try {
        const {topicId,year,season,paperNumber,variant}=req.query;
        const filter={};
        if (topicId) filter.topic = topicId;
        if (year) filter.year = parseInt(year);
        if (season) filter.season = season;
        if (paperNumber) filter.paperNumber = parseInt(paperNumber);
        if (variant) filter.variant = parseInt(variant);
        const papers=await Paper.find(filter).sort({year:-1}).lean();
        res.status(200).json({
            success:true,
            count:papers.length,
            data:papers,
        })
    } catch (error) {
        console.error(error);
    }
}
exports.getPaperById=async(req,res)=>{
    try {
        const paper=await Paper.findById(req.params.id)
        .populate({
            path:"topic",
            select:"name",
            populate:{
                path:"subject",
                select:"name",
                populate:{
                    path:"board",
                    select:"name",
                },
            },
        }).lean();
        if(!paper){
            return res.status(404).json({
                message:"Paper not found"
            });
        }
        res.status(200).json({
            success:true,
            data:paper,
        })
    } catch (error) {
        console.error(error);
    }
};
exports.deletePaper = async (req, res) => {
    try {
      const paper = await Paper.findById(req.params.id);
  
      if (!paper) {
        return res.status(404).json({
          message: "Paper not found",
        });
      }
  
      const topic = await Topic.findById(paper.topic).select("subject");
  
      // Delete paper
      await paper.deleteOne();
  
      // Decrement counts
      await Topic.findByIdAndUpdate(paper.topic, {
        $inc: { numberOfPapers: -1 },
      });
  
      await Subject.findByIdAndUpdate(topic.subject, {
        $inc: { numberOfPapers: -1 },
      });
  
      res.status(200).json({
        success: true,
        message: "Paper deleted successfully",
      });
  
    } catch (error) {
        console.error(error);
    }
  };
  