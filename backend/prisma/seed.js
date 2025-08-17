"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var universities, _i, universities_1, university, existing, courses, _a, courses_1, course, university, existing;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🌱 Starting database seed...');
                    universities = [
                        {
                            name: 'University of California, Berkeley',
                            domain: 'berkeley.edu',
                            location: 'Berkeley, CA'
                        },
                        {
                            name: 'Stanford University',
                            domain: 'stanford.edu',
                            location: 'Stanford, CA'
                        },
                        {
                            name: 'Massachusetts Institute of Technology',
                            domain: 'mit.edu',
                            location: 'Cambridge, MA'
                        },
                        {
                            name: 'Harvard University',
                            domain: 'harvard.edu',
                            location: 'Cambridge, MA'
                        },
                        {
                            name: 'University of Toronto',
                            domain: 'utoronto.ca',
                            location: 'Toronto, ON'
                        },
                        {
                            name: 'McGill University',
                            domain: 'mcgill.ca',
                            location: 'Montreal, QC'
                        },
                        {
                            name: 'University of British Columbia',
                            domain: 'ubc.ca',
                            location: 'Vancouver, BC'
                        }
                    ];
                    _i = 0, universities_1 = universities;
                    _b.label = 1;
                case 1:
                    if (!(_i < universities_1.length)) return [3 /*break*/, 6];
                    university = universities_1[_i];
                    return [4 /*yield*/, prisma.university.findUnique({
                            where: { domain: university.domain }
                        })];
                case 2:
                    existing = _b.sent();
                    if (!!existing) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma.university.create({
                            data: university
                        })];
                case 3:
                    _b.sent();
                    console.log("\u2705 Created university: ".concat(university.name));
                    return [3 /*break*/, 5];
                case 4:
                    console.log("\u23ED\uFE0F  University already exists: ".concat(university.name));
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    courses = [
                        {
                            code: 'CS61A',
                            name: 'Structure and Interpretation of Computer Programs',
                            description: 'Introduction to programming and computer science',
                            department: 'Computer Science',
                            level: 'UNDERGRADUATE',
                            universityDomain: 'berkeley.edu'
                        },
                        {
                            code: 'CS106B',
                            name: 'Programming Abstractions',
                            description: 'Advanced programming concepts and data structures',
                            department: 'Computer Science',
                            level: 'UNDERGRADUATE',
                            universityDomain: 'stanford.edu'
                        },
                        {
                            code: '6.006',
                            name: 'Introduction to Algorithms',
                            description: 'Fundamental algorithms and data structures',
                            department: 'Computer Science',
                            level: 'UNDERGRADUATE',
                            universityDomain: 'mit.edu'
                        },
                        {
                            code: 'MATH101',
                            name: 'Calculus I',
                            description: 'Introduction to differential calculus',
                            department: 'Mathematics',
                            level: 'UNDERGRADUATE',
                            universityDomain: 'harvard.edu'
                        }
                    ];
                    _a = 0, courses_1 = courses;
                    _b.label = 7;
                case 7:
                    if (!(_a < courses_1.length)) return [3 /*break*/, 13];
                    course = courses_1[_a];
                    return [4 /*yield*/, prisma.university.findUnique({
                            where: { domain: course.universityDomain }
                        })];
                case 8:
                    university = _b.sent();
                    if (!university) return [3 /*break*/, 12];
                    return [4 /*yield*/, prisma.course.findFirst({
                            where: {
                                code: course.code,
                                universityId: university.id
                            }
                        })];
                case 9:
                    existing = _b.sent();
                    if (!!existing) return [3 /*break*/, 11];
                    return [4 /*yield*/, prisma.course.create({
                            data: {
                                code: course.code,
                                name: course.name,
                                description: course.description,
                                department: course.department,
                                level: course.level,
                                universityId: university.id
                            }
                        })];
                case 10:
                    _b.sent();
                    console.log("\u2705 Created course: ".concat(course.code, " - ").concat(course.name));
                    return [3 /*break*/, 12];
                case 11:
                    console.log("\u23ED\uFE0F  Course already exists: ".concat(course.code));
                    _b.label = 12;
                case 12:
                    _a++;
                    return [3 /*break*/, 7];
                case 13:
                    console.log('🎉 Database seed completed!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
